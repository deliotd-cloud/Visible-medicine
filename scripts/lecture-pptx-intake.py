"""Inspect an explicitly selected local PPTX into a held source-review package.

Never renders, executes, extracts media, fetches relationships, uploads or writes
to an application database. A package is NOT an accepted lecture manifest.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import posixpath
import re
import stat
import sys
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET
import zipfile

SCHEMA = "visible-medicine-lecture-pptx-intake-v1"
MAX_ARCHIVE_BYTES = 256 * 1024 * 1024
MAX_PART_BYTES = 32 * 1024 * 1024
MAX_XML_BYTES = 4 * 1024 * 1024
MAX_TOTAL_BYTES = 512 * 1024 * 1024
MAX_ENTRIES = 10_000
MAX_SLIDES = 500
MAX_TEXT_CHARS = 2_000_000
P = "http://schemas.openxmlformats.org/presentationml/2006/main"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG = "http://schemas.openxmlformats.org/package/2006/relationships"
CT = "http://schemas.openxmlformats.org/package/2006/content-types"
NS = {"p": P, "a": A, "r": R}


class IntakeError(ValueError):
    """Source or package cannot be safely and unambiguously inspected."""


def digest_stream(stream, maximum: int) -> tuple[str, int]:
    digest, count = hashlib.sha256(), 0
    while chunk := stream.read(1024 * 1024):
        count += len(chunk)
        if count > maximum:
            raise IntakeError("Source or expanded part exceeds its size limit")
        digest.update(chunk)
    return digest.hexdigest(), count


def reject_link_path(path: Path) -> None:
    for candidate in [path, *path.parents]:
        if candidate.is_symlink() or getattr(candidate, "is_junction", lambda: False)():
            raise IntakeError("Symlink or junction paths are not admitted")


def safe_part_name(name: str) -> str:
    if (not name or len(name) > 4096 or name.startswith("/") or "\\" in name
            or ":" in name or re.search(r"[\x00-\x1f\x7f]", name)
            or any(segment in ("", ".", "..") for segment in name.rstrip("/").split("/"))):
        raise IntakeError("Unsafe package part path")
    return name.rstrip("/")


def parse_xml(data: bytes, name: str) -> ET.Element:
    # Entity expansion is never needed by OOXML; reject declarations before ET.
    if (len(data) > MAX_XML_BYTES or b"\x00" in data
            or data.startswith((b"\xff\xfe", b"\xfe\xff"))
            or re.search(br"<!\s*(?:DOCTYPE|ENTITY)\b", data, re.I)):
        raise IntakeError("Unsupported XML declaration or oversized XML part")
    try:
        return ET.fromstring(data)
    except ET.ParseError as error:
        raise IntakeError("Malformed XML package part: " + name) from error


def internal_target(part: str, target: str) -> str:
    decoded = unquote(target)
    parsed = urlsplit(decoded)
    if (parsed.scheme or parsed.netloc or parsed.query or parsed.fragment or
            "\\" in decoded or re.search(r"[\x00-\x1f\x7f]", decoded)):
        raise IntakeError("Unsupported internal relationship target")
    base = "" if decoded.startswith("/") else posixpath.dirname(part)
    normalized = posixpath.normpath(posixpath.join(base, decoded.lstrip("/")))
    return safe_part_name(normalized)


def paragraphs(element: ET.Element) -> list[dict]:
    result = []
    for paragraph in element.findall(".//a:p", NS):
        pieces = []
        for node in paragraph.iter():
            if node.tag == "{" + A + "}t":
                pieces.append(node.text or "")
            elif node.tag == "{" + A + "}br":
                pieces.append("\n")
            elif node.tag == "{" + A + "}tab":
                pieces.append("\t")
        text = "".join(pieces)
        properties = paragraph.find("a:pPr", NS)
        result.append({"text": text, "level": properties.get("lvl") if properties is not None else None})
    return result


def blocks(root: ET.Element) -> list[dict]:
    tree = root.find("p:cSld/p:spTree", NS)
    if tree is None:
        return []
    result = []

    def visit(parent: ET.Element, location: str) -> None:
        for index, shape in enumerate(parent):
            kind = shape.tag.rsplit("}", 1)[-1]
            shape_location = f"{location}/{index}:{kind}"
            if kind == "grpSp":
                visit(shape, shape_location)
                continue
            content = paragraphs(shape)
            if not content:
                continue
            identity = shape.find(".//p:cNvPr", NS)
            placeholder = shape.find(".//p:ph", NS)
            transform = shape.find(".//a:xfrm", NS)
            bounds = None
            if transform is not None:
                offset, extent = transform.find("a:off", NS), transform.find("a:ext", NS)
                bounds = {"offset": dict(offset.attrib) if offset is not None else None,
                          "extent": dict(extent.attrib) if extent is not None else None,
                          "transform": dict(transform.attrib)}
            result.append({"shapeId": identity.get("id") if identity is not None else None,
                           "location": shape_location, "kind": kind,
                           "placeholder": placeholder.get("type", "body") if placeholder is not None else None,
                           "paragraphs": content, "boundsEmu": bounds,
                           "normalizedShapeXmlSha256": hashlib.sha256(ET.tostring(shape)).hexdigest()})

    visit(tree, "spTree")
    return result


def inspect_pptx(path: Path, expected_sha256: str) -> dict:
    source = Path(path)
    if not re.fullmatch(r"[a-f0-9]{64}", expected_sha256 or ""):
        raise IntakeError("A lowercase SHA-256 source pin is required")
    if not source.is_absolute() or source.suffix.lower() != ".pptx":
        raise IntakeError("Select an absolute local .pptx path")
    reject_link_path(source)
    if not source.is_file():
        raise IntakeError("Presentation source is unavailable")
    issues = ["independent-clinical-review-required", "rights-review-required",
              "privacy-review-required", "visual-fidelity-review-required"]
    try:
        with source.open("rb") as handle:
            source_hash, source_bytes = digest_stream(handle, MAX_ARCHIVE_BYTES)
            if source_hash != expected_sha256:
                raise IntakeError("Presentation source does not match the selected revision")
            handle.seek(0)
            with zipfile.ZipFile(handle) as archive:
                entries = archive.infolist()
                if not entries or len(entries) > MAX_ENTRIES:
                    raise IntakeError("Invalid package entry count")
                parts, seen, total = {}, set(), 0
                for info in entries:
                    name = safe_part_name(info.filename)
                    if name.casefold() in seen:
                        raise IntakeError("Duplicate or case-ambiguous package part")
                    seen.add(name.casefold())
                    mode = info.external_attr >> 16
                    if stat.S_ISLNK(mode) or info.flag_bits & 1:
                        raise IntakeError("Symlink or encrypted package part is not admitted")
                    if info.compress_type not in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED):
                        raise IntakeError("Unsupported package compression")
                    if info.is_dir():
                        continue
                    if info.file_size > MAX_PART_BYTES:
                        raise IntakeError("Expanded package part exceeds its size limit")
                    total += info.file_size
                    if total > MAX_TOTAL_BYTES:
                        raise IntakeError("Expanded package exceeds its total size limit")
                    with archive.open(info) as stream:
                        part_hash, count = digest_stream(stream, MAX_PART_BYTES)
                    if count != info.file_size:
                        raise IntakeError("Expanded part size does not match its record")
                    if name.endswith((".xml", ".rels")):
                        parse_xml(archive.read(info), name)
                    parts[name] = {"part": name, "sha256": part_hash, "bytes": count}

                def xml(name: str) -> ET.Element:
                    if name not in parts:
                        raise IntakeError("Required package part is missing: " + name)
                    return parse_xml(archive.read(name), name)

                content = xml("[Content_Types].xml")
                if content.tag != "{" + CT + "}Types":
                    raise IntakeError("Unsupported content-types namespace")
                defaults, overrides = {}, {}
                for child in content:
                    if child.tag == "{" + CT + "}Default":
                        key = child.get("Extension", "").lower()
                        if not key or key in defaults:
                            raise IntakeError("Ambiguous default content type")
                        defaults[key] = child.get("ContentType", "")
                    elif child.tag == "{" + CT + "}Override":
                        key = safe_part_name(child.get("PartName", "").lstrip("/"))
                        if key in overrides:
                            raise IntakeError("Ambiguous override content type")
                        overrides[key] = child.get("ContentType", "")
                for name, metadata in parts.items():
                    metadata["contentType"] = overrides.get(name, defaults.get(PurePosixPath(name).suffix[1:].lower(), ""))

                external, relationship_inventory, relationship_cache = [], [], {}

                def relationships(part: str, required: bool = False) -> dict[str, dict]:
                    if part in relationship_cache:
                        return relationship_cache[part]
                    rel_path = posixpath.join(posixpath.dirname(part), "_rels", posixpath.basename(part) + ".rels") if part else "_rels/.rels"
                    if rel_path not in parts and not required:
                        return {}
                    rel_root = xml(rel_path)
                    if rel_root.tag != "{" + PKG + "}Relationships":
                        raise IntakeError("Unsupported relationship namespace")
                    found = {}
                    for rel in rel_root:
                        if rel.tag != "{" + PKG + "}Relationship":
                            raise IntakeError("Unsupported relationship element")
                        identity, target, kind = rel.get("Id", ""), rel.get("Target", ""), rel.get("Type", "")
                        mode = rel.get("TargetMode", "Internal")
                        if not identity or identity in found or not target or not kind or mode not in ("Internal", "External"):
                            raise IntakeError("Invalid or duplicate relationship identity")
                        item = {"id": identity, "type": kind, "targetMode": mode, "target": target,
                                "part": internal_target(part, target) if mode == "Internal" else None}
                        found[identity] = item
                        if mode == "External":
                            external.append({"sourcePart": part, **item})
                    relationship_inventory.append({"sourcePart": part, "relationships": list(found.values())})
                    relationship_cache[part] = found
                    return found

                root_relationships = relationships("", True)
                office = [rel for rel in root_relationships.values() if rel["type"].endswith("/officeDocument")]
                if len(office) != 1 or office[0]["targetMode"] != "Internal":
                    raise IntakeError("One internal presentation relationship is required")
                presentation_part = office[0]["part"]
                presentation = xml(presentation_part)
                if presentation.tag != "{" + P + "}presentation":
                    raise IntakeError("Source is not a supported PowerPoint presentation")
                presentation_rels = relationships(presentation_part)
                order = presentation.findall("p:sldIdLst/p:sldId", NS)
                if not order or len(order) > MAX_SLIDES:
                    raise IntakeError("Invalid or unsupported slide count")
                # Inventory custom media locations and embedded fonts too. No asset
                # receives rights merely from its extension, folder or content type.
                assets = [{**metadata, "rightsStatus": "unreviewed", "privacyStatus": "unreviewed"}
                          for name, metadata in parts.items() if name.startswith("ppt/media/")
                          or metadata["contentType"].startswith(("image/", "audio/", "video/", "font/"))
                          or PurePosixPath(name).suffix.lower() in (".ttf", ".otf", ".odttf", ".woff", ".woff2", ".fntdata")]
                assets_by_part = {asset["part"]: asset for asset in assets}
                slides, slide_ids, slide_parts, text_size = [], set(), set(), 0
                for position, item in enumerate(order, 1):
                    slide_id, rel_id = item.get("id", ""), item.get("{" + R + "}id", "")
                    rel = presentation_rels.get(rel_id)
                    if not slide_id or slide_id in slide_ids or not rel or not rel["type"].endswith("/slide") or rel["targetMode"] != "Internal":
                        raise IntakeError("Invalid, duplicate or external slide identity")
                    part = rel["part"]
                    if part in slide_parts:
                        raise IntakeError("A slide part cannot have two source identities")
                    slide_ids.add(slide_id)
                    slide_parts.add(part)
                    root = xml(part)
                    if root.tag != "{" + P + "}sld":
                        raise IntakeError("Invalid slide part")
                    slide_rels = relationships(part)
                    text_blocks = blocks(root)
                    titles = ["\n".join(p["text"] for p in block["paragraphs"]) for block in text_blocks if block["placeholder"] in ("title", "ctrTitle")]
                    title = titles[0] if len(titles) == 1 else ""
                    if len(titles) != 1:
                        issues.append("missing-or-ambiguous-slide-title")
                    notes_blocks, notes_parts = [], []
                    for note_rel in slide_rels.values():
                        if note_rel["type"].endswith("/notesSlide"):
                            if note_rel["targetMode"] != "Internal":
                                raise IntakeError("External notes are not admitted")
                            note = xml(note_rel["part"])
                            notes_blocks.extend(blocks(note))
                            notes_parts.append(parts[note_rel["part"]])
                            relationships(note_rel["part"])
                    if len(notes_parts) > 1:
                        raise IntakeError("Ambiguous slide notes relationship")
                    media, parents = [], {child: parent for parent in root.iter() for child in parent}
                    for node in root.iter():
                        for attr in ("embed", "link"):
                            media_id = node.get("{" + R + "}" + attr)
                            if not media_id:
                                continue
                            media_rel = slide_rels.get(media_id)
                            if not media_rel:
                                raise IntakeError("Referenced media relationship is missing")
                            ancestor = node
                            while ancestor in parents and ancestor.tag.rsplit("}", 1)[-1] not in ("pic", "sp", "graphicFrame", "grpSp"):
                                ancestor = parents[ancestor]
                            identity = ancestor.find(".//p:cNvPr", NS)
                            asset = assets_by_part.get(media_rel["part"])
                            media.append({"relationshipId": media_id, "targetMode": media_rel["targetMode"],
                                          "part": media_rel["part"], "sha256": asset["sha256"] if asset else None,
                                          "shapeId": identity.get("id") if identity is not None else None,
                                          "altText": identity.get("descr", "") if identity is not None else "",
                                          "sourceTitle": identity.get("title", "") if identity is not None else "",
                                          "caption": None, "rightsStatus": "unreviewed", "privacyStatus": "unreviewed"})
                            if media_rel["targetMode"] == "Internal" and media_rel["part"] not in parts:
                                raise IntakeError("Referenced media part is missing")
                    features = {name: sum(1 for element in root.iter() if element.tag.rsplit("}", 1)[-1] in tags)
                                for name, tags in {"groups": {"grpSp"}, "tables": {"tbl"}, "charts": {"chart"},
                                                   "smartArt": {"relIds"}, "timing": {"timing"}, "transitions": {"transition"},
                                                   "embeddedObjects": {"oleObj"}, "pictures": {"pic"}}.items()}
                    tables = [{"rows": [[paragraphs(cell) for cell in row.findall("a:tc", NS)] for row in table.findall("a:tr", NS)]}
                              for table in root.findall(".//a:tbl", NS)]
                    for block in text_blocks + notes_blocks:
                        text_size += sum(len(paragraph["text"]) for paragraph in block["paragraphs"])
                    if text_size > MAX_TEXT_CHARS:
                        raise IntakeError("Presentation text exceeds the inspection limit")
                    slides.append({"position": position, "sourceSlideId": slide_id, "part": part,
                                   "partSha256": parts[part]["sha256"], "anchor": source_hash + ":" + part,
                                   "title": title, "textBlocks": text_blocks, "notesBlocks": notes_blocks,
                                   "notesParts": notes_parts, "media": media, "tables": tables, "features": features})
                # Masters, layouts and other parts can carry links not mentioned by
                # a slide. Keep those held relationships visible without fetching.
                for name in parts:
                    if not name.endswith(".rels") or name == "_rels/.rels":
                        continue
                    rel_name = PurePosixPath(name)
                    if rel_name.parent.name != "_rels":
                        issues.append("unrecognized-relationship-location-held")
                        continue
                    owner = str(rel_name.parent.parent / rel_name.name[:-5])
                    if owner not in parts:
                        issues.append("orphan-relationships-held")
                    relationships(owner)
                if assets:
                    issues.append("media-quarantined")
                if external:
                    issues.append("external-relationships-not-fetched")
                if any(any(slide["features"].values()) for slide in slides):
                    issues.append("native-layout-and-feature-conversion-required")
                active_parts = [name for name in parts if name.lower().endswith((".bin", ".exe", ".vbs", ".js")) or "/embeddings/" in name.lower()]
                if active_parts:
                    issues.append("active-or-embedded-parts-not-executed")
                known = {"cSld", "clrMapOvr", "transition", "timing", "extLst"}
                if any(any(child.tag.rsplit("}", 1)[-1] not in known for child in xml(slide["part"])) for slide in slides):
                    issues.append("unknown-slide-features-held")
                result = {"schema": SCHEMA, "state": "quarantined", "readyForPublication": False,
                          "source": {"sha256": source_hash, "bytes": source_bytes},
                          "slides": slides, "assets": assets, "parts": list(parts.values()),
                          "relationships": relationship_inventory, "externalRelationships": external,
                          "activeParts": active_parts, "issues": sorted(set(issues)),
                          "limits": {"renderedFidelityVerified": False, "mediaExtracted": False,
                                     "clinicalApproval": None, "rightsApproval": None, "privacyApproval": None,
                                     "lectureManifest": False, "liveImport": False,
                                     "note": "Local source inspection only. Original PPTX remains authoritative; reviewed rendering, rights, privacy, accessibility and clinical approval are required before conversion/admission."}}
            handle.seek(0)
            final_hash, final_bytes = digest_stream(handle, MAX_ARCHIVE_BYTES)
            if final_hash != source_hash or final_bytes != source_bytes:
                raise IntakeError("Presentation changed during inspection")
            return result
    except (zipfile.BadZipFile, RuntimeError, OSError, KeyError, NotImplementedError) as error:
        raise IntakeError("Presentation package could not be inspected safely") from error


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--expected-sha256", required=True)
    parser.add_argument("--private-root", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args(argv)
    try:
        root, output = args.private_root, args.output
        if not root.is_absolute() or not output.is_absolute() or output.suffix.lower() != ".json":
            raise IntakeError("Explicit absolute private-root and JSON output paths are required")
        reject_link_path(root)
        reject_link_path(output)
        resolved_root, resolved_output = root.resolve(strict=True), output.resolve()
        repository = Path(__file__).resolve().parent.parent
        repository_or_hosted_path = any((parent / ".git").exists()
            or (parent / ".openai" / "hosting.json").exists()
            for parent in [resolved_output.parent, *resolved_output.parent.parents])
        if (not resolved_root.is_dir() or not resolved_output.is_relative_to(resolved_root)
                or resolved_root == resolved_output or resolved_output.is_relative_to(repository)
                or resolved_root.is_relative_to(repository) or repository_or_hosted_path or output.exists()):
            raise IntakeError("Use a new output file in a private staging directory outside the website")
        if not output.parent.is_dir():
            raise IntakeError("The explicit private output parent must already exist")
        result = inspect_pptx(args.input, args.expected_sha256)
        # Exclusive creation prevents overwrite. No archive entries are extracted.
        with output.open("x", encoding="utf-8", newline="\n") as destination:
            json.dump(result, destination, ensure_ascii=False, indent=2)
            destination.write("\n")
        print(json.dumps({"schema": SCHEMA, "state": result["state"], "sourceSha256": result["source"]["sha256"],
                          "slides": len(result["slides"]), "quarantinedAssets": len(result["assets"]),
                          "readyForPublication": False, "mediaExtracted": False, "liveImport": False}))
        return 0
    except (IntakeError, OSError) as error:
        print("Intake refused: " + str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
