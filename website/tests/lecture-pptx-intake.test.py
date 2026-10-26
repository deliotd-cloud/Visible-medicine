"""Synthetic, local-only regression checks for quarantined PPTX inspection."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

sys.dont_write_bytecode = True


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "lecture-pptx-intake.py"
P = "http://schemas.openxmlformats.org/presentationml/2006/main"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
REL = "http://schemas.openxmlformats.org/package/2006/relationships"
CT = "http://schemas.openxmlformats.org/package/2006/content-types"
OFFICE = f"{R}/officeDocument"
SLIDE = f"{R}/slide"
NOTES = f"{R}/notesSlide"
IMAGE = f"{R}/image"


def package_parts() -> dict[str, bytes]:
    """Two synthetic slides: slide10 is first despite slide2 sorting earlier."""
    return {
        "[Content_Types].xml": (
            f'<Types xmlns="{CT}">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Default Extension="png" ContentType="image/png"/>'
            '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
            '<Override PartName="/ppt/slides/slide10.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
            '<Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
            '<Override PartName="/ppt/notesSlides/notesSlide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>'
            '</Types>'
        ).encode(),
        "_rels/.rels": (
            f'<Relationships xmlns="{REL}"><Relationship Id="rOffice" Type="{OFFICE}" Target="ppt/presentation.xml"/></Relationships>'
        ).encode(),
        "ppt/presentation.xml": (
            f'<p:presentation xmlns:p="{P}" xmlns:r="{R}"><p:sldIdLst>'
            '<p:sldId id="300" r:id="rSecond"/><p:sldId id="301" r:id="rFirst"/>'
            '</p:sldIdLst></p:presentation>'
        ).encode(),
        "ppt/_rels/presentation.xml.rels": (
            f'<Relationships xmlns="{REL}">'
            f'<Relationship Id="rFirst" Type="{SLIDE}" Target="slides/slide2.xml"/>'
            f'<Relationship Id="rSecond" Type="{SLIDE}" Target="slides/slide10.xml"/>'
            '</Relationships>'
        ).encode(),
        "ppt/slides/slide10.xml": (
            f'<p:sld xmlns:p="{P}" xmlns:a="{A}" xmlns:r="{R}"><p:cSld><p:spTree>'
            '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>'
            '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr/>'
            '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>Orientation</a:t></a:r></a:p></p:txBody></p:sp>'
            '<p:sp><p:nvSpPr><p:cNvPr id="3" name="Body"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr/>'
            '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>Independent anatomy teaching</a:t></a:r></a:p></p:txBody></p:sp>'
            '<p:pic><p:nvPicPr><p:cNvPr id="4" name="Diagram" descr="Synthetic orientation diagram" title="Diagram"/>'
            '<p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rImg"/></p:blipFill><p:spPr/></p:pic>'
            '</p:spTree></p:cSld></p:sld>'
        ).encode(),
        "ppt/slides/_rels/slide10.xml.rels": (
            f'<Relationships xmlns="{REL}">'
            f'<Relationship Id="rImg" Type="{IMAGE}" Target="../media/image1.png"/>'
            f'<Relationship Id="rNotes" Type="{NOTES}" Target="../notesSlides/notesSlide1.xml"/>'
            '<Relationship Id="rLink" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://invalid.example/never-fetch" TargetMode="External"/>'
            '</Relationships>'
        ).encode(),
        "ppt/notesSlides/notesSlide1.xml": (
            f'<p:notes xmlns:p="{P}" xmlns:a="{A}"><p:cSld><p:spTree>'
            '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Notes"/><p:cNvSpPr/><p:nvPr><p:ph type="body"/></p:nvPr></p:nvSpPr>'
            '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>Verify the image licence.</a:t></a:r></a:p></p:txBody></p:sp>'
            '</p:spTree></p:cSld></p:notes>'
        ).encode(),
        "ppt/slides/slide2.xml": (
            f'<p:sld xmlns:p="{P}" xmlns:a="{A}"><p:cSld><p:spTree>'
            '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Second"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
            '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>Follow-up</a:t></a:r></a:p></p:txBody></p:sp>'
            '</p:spTree></p:cSld></p:sld>'
        ).encode(),
        "ppt/media/image1.png": b"synthetic-not-an-image\x00\x01",
    }


def write_package(path: Path, parts: dict[str, bytes], *, extra: list[tuple[str, bytes]] | None = None) -> str:
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, content in parts.items():
            archive.writestr(name, content)
        for name, content in extra or []:
            archive.writestr(name, content)
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_module():
    spec = importlib.util.spec_from_file_location("lecture_pptx_intake", SCRIPT)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class LecturePptxIntakeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.intake = load_module()

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="lecture-intake-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / "deck.pptx"
        self.parts = package_parts()
        self.sha = write_package(self.source, self.parts)

    def inspect(self):
        return self.intake.inspect_pptx(self.source, self.sha)

    def assert_rejected(self):
        with self.assertRaises(self.intake.IntakeError):
            self.inspect()

    def test_quarantined_order_and_content_are_source_bound(self):
        result = self.inspect()
        self.assertEqual(result["schema"], self.intake.SCHEMA)
        self.assertEqual(result["state"], "quarantined")
        self.assertIs(result["readyForPublication"], False)
        self.assertEqual(result["source"]["sha256"], self.sha)
        self.assertEqual(result["source"]["bytes"], self.source.stat().st_size)
        self.assertEqual([s["part"] for s in result["slides"]], ["ppt/slides/slide10.xml", "ppt/slides/slide2.xml"])
        first = result["slides"][0]
        self.assertEqual(first["partSha256"], hashlib.sha256(self.parts[first["part"]]).hexdigest())
        self.assertTrue(first["anchor"])
        self.assertEqual(first["title"], "Orientation")
        self.assertIn("Independent anatomy teaching", json.dumps(first["textBlocks"]))
        self.assertIn("Verify the image licence.", json.dumps(first["notesBlocks"]))
        self.assertIn("Synthetic orientation diagram", json.dumps(first["media"]))
        self.assertEqual(result["assets"][0]["sha256"], hashlib.sha256(self.parts["ppt/media/image1.png"]).hexdigest())
        self.assertEqual(result["assets"][0]["contentType"], "image/png")
        self.assertEqual(result["assets"][0]["bytes"], len(self.parts["ppt/media/image1.png"]))
        self.assertEqual(len(result["externalRelationships"]), 1)
        self.assertEqual(result["externalRelationships"][0]["targetMode"], "External")
        self.assertIsNone(result["externalRelationships"][0]["part"])
        for gate in ("rights", "privacy", "visual"):
            self.assertIn(gate, json.dumps(result["issues"]).lower())

    def test_repeated_image_occurrences_keep_separate_raw_placement_and_crop(self):
        modified = dict(self.parts)
        slide = modified["ppt/slides/slide10.xml"]
        first = (b'<p:pic><p:nvPicPr><p:cNvPr id="4" name="Diagram" descr="Synthetic orientation diagram" title="Diagram"/>'
                 b'<p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rImg"/></p:blipFill><p:spPr/></p:pic>')
        placements = (
            b'<p:pic><p:nvPicPr><p:cNvPr id="4" name="Diagram" descr="First"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>'
            b'<p:blipFill><a:blip r:embed="rImg"/><a:srcRect l="1200" r="3400"/></p:blipFill>'
            b'<p:spPr><a:xfrm rot="60000" flipH="1"><a:off x="100" y="200"/><a:ext cx="300" cy="400"/></a:xfrm></p:spPr></p:pic>'
            b'<p:pic><p:nvPicPr><p:cNvPr id="8" name="Second" descr="Second"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>'
            b'<p:blipFill><a:blip r:embed="rImg"/></p:blipFill>'
            b'<p:spPr><a:xfrm flipV="1"><a:off x="500" y="600"/><a:ext cx="700" cy="800"/></a:xfrm></p:spPr></p:pic>')
        self.assertIn(first, slide)
        modified["ppt/slides/slide10.xml"] = slide.replace(first, placements)
        self.sha = write_package(self.source, modified)
        result = self.inspect()
        media = result["slides"][0]["media"]
        self.assertEqual([item["shapeId"] for item in media], ["4", "8"])
        self.assertEqual(len({item["sourceShapePath"] for item in media}), 2)
        self.assertEqual(len({item["sourceXmlPath"] for item in media}), 2)
        self.assertEqual([item["sha256"] for item in media], [media[0]["sha256"]] * 2)
        self.assertEqual(media[0]["localTransformEmu"], {
            "present": True, "offset": {"x": "100", "y": "200"}, "extent": {"cx": "300", "cy": "400"},
            "rotation": "60000", "flipH": "1", "flipV": None, "childOffset": None, "childExtent": None,
            "attributes": {"rot": "60000", "flipH": "1"}})
        self.assertEqual(media[0]["sourceCrop"]["attributes"], {"l": "1200", "r": "3400"})
        self.assertTrue(media[0]["sourceCrop"]["sourceXmlPath"].startswith(media[0]["sourceShapePath"]))
        self.assertEqual(media[1]["localTransformEmu"]["offset"], {"x": "500", "y": "600"})
        self.assertEqual(media[1]["localTransformEmu"]["flipV"], "1")
        self.assertIsNone(media[1]["sourceCrop"])
        self.assertTrue(all(item["rightsStatus"] == "unreviewed" for item in media))
        self.assertFalse(result["readyForPublication"])

    def test_nested_groups_and_missing_local_transform_remain_uncomposed(self):
        modified = dict(self.parts)
        slide = modified["ppt/slides/slide10.xml"]
        first = (b'<p:pic><p:nvPicPr><p:cNvPr id="4" name="Diagram" descr="Synthetic orientation diagram" title="Diagram"/>'
                 b'<p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rImg"/></p:blipFill><p:spPr/></p:pic>')
        grouped = (
            b'<p:grpSp><p:nvGrpSpPr><p:cNvPr id="10" name="Outer"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
            b'<p:grpSpPr><a:xfrm rot="120000"><a:off x="11" y="12"/><a:ext cx="13" cy="14"/>'
            b'<a:chOff x="15" y="16"/><a:chExt cx="17" cy="18"/></a:xfrm></p:grpSpPr>'
            b'<p:grpSp><p:nvGrpSpPr><p:cNvPr id="11" name="Inner"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
            b'<p:grpSpPr><a:xfrm flipH="1"><a:chOff x="21" y="22"/><a:chExt cx="23" cy="24"/></a:xfrm></p:grpSpPr>'
            + first + b'</p:grpSp></p:grpSp>')
        self.assertIn(first, slide)
        modified["ppt/slides/slide10.xml"] = slide.replace(first, grouped)
        self.sha = write_package(self.source, modified)
        media = self.inspect()["slides"][0]["media"][0]
        self.assertEqual(media["shapeId"], "4")
        self.assertEqual([group["shapeId"] for group in media["ancestorGroups"]], ["10", "11"])
        self.assertEqual(media["ancestorGroups"][0]["localTransformEmu"]["childOffset"], {"x": "15", "y": "16"})
        self.assertEqual(media["ancestorGroups"][0]["localTransformEmu"]["childExtent"], {"cx": "17", "cy": "18"})
        self.assertEqual(media["ancestorGroups"][1]["localTransformEmu"]["childOffset"], {"x": "21", "y": "22"})
        self.assertEqual(media["ancestorGroups"][1]["localTransformEmu"]["flipH"], "1")
        self.assertEqual(media["localTransformEmu"]["present"], False)
        self.assertIsNone(media["localTransformEmu"]["offset"])
        self.assertTrue(media["sourceXmlPath"].startswith(media["sourceShapePath"]))

    def test_background_reference_has_no_borrowed_shape_identity(self):
        modified = dict(self.parts)
        slide = modified["ppt/slides/slide10.xml"]
        background = b'<p:bg><p:bgPr><a:blipFill><a:blip r:embed="rImg"/><a:srcRect t="500"/></a:blipFill></p:bgPr></p:bg>'
        modified["ppt/slides/slide10.xml"] = slide.replace(b'<p:cSld>', b'<p:cSld>' + background)
        self.sha = write_package(self.source, modified)
        media = self.inspect()["slides"][0]["media"]
        self.assertEqual(len(media), 2)
        self.assertIsNone(media[0]["shapeId"])
        self.assertIsNone(media[0]["sourceShapePath"])
        self.assertIsNone(media[0]["localTransformEmu"])
        self.assertEqual(media[0]["ancestorGroups"], [])
        self.assertEqual(media[0]["sourceCrop"]["attributes"], {"t": "500"})
        self.assertIn("bg", media[0]["sourceXmlPath"])
        self.assertEqual(media[1]["shapeId"], "4")
        self.assertEqual(media[0]["rightsStatus"], "unreviewed")

    def test_wrong_digest_and_corrupt_zip(self):
        with self.assertRaises(self.intake.IntakeError):
            self.intake.inspect_pptx(self.source, "0" * 64)
        self.source.write_bytes(b"not a ZIP archive")
        self.sha = hashlib.sha256(self.source.read_bytes()).hexdigest()
        self.assert_rejected()

    def test_duplicate_casefold_and_unsafe_entry_names(self):
        cases = [[("ppt/slides/slide10.xml", b"duplicate")],
                 [("PPT/SLIDES/SLIDE10.XML", b"case duplicate")],
                 [("../escape.xml", b"escape")],
                 [("/absolute.xml", b"absolute")],
                 [("ppt\\slides\\backslash.xml", b"backslash")]]
        for extra in cases:
            with self.subTest(extra=extra[0][0]):
                self.sha = write_package(self.source, self.parts, extra=extra)
                self.assert_rejected()

    def test_symlink_entry_is_rejected(self):
        with zipfile.ZipFile(self.source, "w") as archive:
            for name, content in self.parts.items():
                archive.writestr(name, content)
            link = zipfile.ZipInfo("ppt/media/link.png")
            link.create_system = 3
            link.external_attr = (0o120777 << 16)
            archive.writestr(link, b"outside")
        self.sha = hashlib.sha256(self.source.read_bytes()).hexdigest()
        self.assert_rejected()

    def test_dtd_entity_and_dangling_slide_relationship(self):
        replacements = [
            ("ppt/slides/slide10.xml", b'<!DOCTYPE p:sld [<!ENTITY x "expanded">]>' + self.parts["ppt/slides/slide10.xml"]),
            ("ppt/_rels/presentation.xml.rels", self.parts["ppt/_rels/presentation.xml.rels"].replace(b"slides/slide10.xml", b"slides/missing.xml")),
            ("ppt/presentation.xml", self.parts["ppt/presentation.xml"].replace(b'id="301"', b'id="300"')),
            ("ppt/presentation.xml", self.parts["ppt/presentation.xml"].replace(b'r:id="rFirst"', b'r:id="rSecond"')),
        ]
        for name, content in replacements:
            with self.subTest(name=name, content=content[:80]):
                modified = dict(self.parts)
                modified[name] = content
                self.sha = write_package(self.source, modified)
                self.assert_rejected()

    def test_utf16_declaration_cannot_bypass_entity_rejection(self):
        modified = dict(self.parts)
        modified["ppt/slides/slide10.xml"] = ('<!DOCTYPE p:sld [<!ENTITY x "expanded">]>' +
            self.parts["ppt/slides/slide10.xml"].decode()).encode("utf-16")
        self.sha = write_package(self.source, modified)
        self.assert_rejected()

    def test_master_links_custom_media_and_embedded_fonts_remain_held(self):
        modified = dict(self.parts)
        modified["[Content_Types].xml"] = modified["[Content_Types].xml"].replace(b'</Types>',
            b'<Default Extension="woff2" ContentType="font/woff2"/></Types>')
        modified["ppt/slideMasters/slideMaster1.xml"] = f'<p:sldMaster xmlns:p="{P}"/>'.encode()
        modified["ppt/slideMasters/_rels/slideMaster1.xml.rels"] = (
            f'<Relationships xmlns="{REL}"><Relationship Id="masterExternal" Type="{R}/hyperlink" '
            'Target="https://invalid.example/never-fetch-master" TargetMode="External"/></Relationships>').encode()
        modified["customAssets/custom.png"] = b"synthetic-custom-picture"
        modified["ppt/fonts/custom.woff2"] = b"synthetic-unlicensed-font"
        self.sha = write_package(self.source, modified)
        result = self.inspect()
        self.assertEqual(len(result["externalRelationships"]), 2)
        by_part = {asset["part"]: asset for asset in result["assets"]}
        for name in ("customAssets/custom.png", "ppt/fonts/custom.woff2"):
            self.assertEqual(by_part[name]["sha256"], hashlib.sha256(modified[name]).hexdigest())
            self.assertEqual(by_part[name]["rightsStatus"], "unreviewed")
        self.assertIs(result["readyForPublication"], False)

    def test_junction_detection_fails_closed_without_creation_privilege(self):
        with patch.object(Path, "is_junction", create=True, return_value=True):
            with self.assertRaises(self.intake.IntakeError):
                self.intake.reject_link_path(self.source)

    def test_external_slide_target_is_never_fetched(self):
        modified = dict(self.parts)
        modified["ppt/_rels/presentation.xml.rels"] = modified["ppt/_rels/presentation.xml.rels"].replace(
            b'Target="slides/slide10.xml"', b'Target="https://invalid.example/never-fetch" TargetMode="External"')
        self.sha = write_package(self.source, modified)
        self.assert_rejected()

    def test_internal_relationship_cannot_escape_package(self):
        modified = dict(self.parts)
        modified["ppt/_rels/presentation.xml.rels"] = modified["ppt/_rels/presentation.xml.rels"].replace(
            b"slides/slide10.xml", b"../../../../outside.xml")
        self.sha = write_package(self.source, modified)
        self.assert_rejected()

    def test_declared_limits_reject_small_synthetic_packages(self):
        limits = [("MAX_ARCHIVE_BYTES", 1), ("MAX_PART_BYTES", 1),
                  ("MAX_XML_BYTES", 1), ("MAX_TOTAL_BYTES", 1),
                  ("MAX_ENTRIES", 1), ("MAX_SLIDES", 1), ("MAX_TEXT_CHARS", 1)]
        for name, constrained in limits:
            with self.subTest(limit=name):
                original = getattr(self.intake, name)
                setattr(self.intake, name, constrained)
                try:
                    self.assert_rejected()
                finally:
                    setattr(self.intake, name, original)

    def test_encrypted_zip_flag_is_rejected(self):
        # zipfile cannot create an encrypted member; flip its local and central flags.
        raw = bytearray(self.source.read_bytes())
        for signature, offset in ((b"PK\x03\x04", 6), (b"PK\x01\x02", 8)):
            index = raw.find(signature)
            self.assertGreaterEqual(index, 0)
            flags = int.from_bytes(raw[index + offset:index + offset + 2], "little") | 1
            raw[index + offset:index + offset + 2] = flags.to_bytes(2, "little")
        self.source.write_bytes(raw)
        self.sha = hashlib.sha256(raw).hexdigest()
        self.assert_rejected()

    def test_active_or_unknown_slide_features_stay_quarantined(self):
        modified = dict(self.parts)
        slide = modified["ppt/slides/slide2.xml"]
        slide = slide.replace(b"</p:spTree>", b'<p:grpSp><p:sp><p:txBody><a:p><a:r><a:t>Grouped</a:t></a:r></a:p></p:txBody></p:sp></p:grpSp><p:graphicFrame><a:graphic><a:graphicData uri="table"><a:tbl/></a:graphicData></a:graphic></p:graphicFrame></p:spTree>')
        modified["ppt/slides/slide2.xml"] = slide.replace(b"</p:sld>", b'<p:timing/><p:transition/><p:extLst><p:ext uri="unknown"/></p:extLst></p:sld>')
        self.sha = write_package(self.source, modified)
        result = self.inspect()
        self.assertIs(result["readyForPublication"], False)
        self.assertTrue(result["slides"][1]["features"])
        self.assertIn("Grouped", json.dumps(result["slides"][1]["textBlocks"]))

    def test_cli_writes_only_new_private_manifest(self):
        private = self.root / "private"
        private.mkdir()
        output = private / "manifest.json"
        args = [sys.executable, str(SCRIPT), "--input", str(self.source), "--expected-sha256", self.sha,
                "--private-root", str(private), "--output", str(output)]
        first = subprocess.run(args, capture_output=True, text=True)
        self.assertEqual(first.returncode, 0, first.stderr)
        manifest = json.loads(output.read_text(encoding="utf-8"))
        self.assertEqual(manifest["source"]["sha256"], self.sha)
        self.assertIs(manifest["readyForPublication"], False)
        prior = output.read_bytes()
        second = subprocess.run(args, capture_output=True, text=True)
        self.assertNotEqual(second.returncode, 0)
        self.assertEqual(output.read_bytes(), prior)

    def test_cli_write_failure_does_not_publish_partial_manifest(self):
        private = self.root / "private"
        private.mkdir()
        output = private / "held.json"

        def fail_after_prefix(_result, destination, **_kwargs):
            destination.write('{"schema":')
            raise OSError("synthetic interrupted write")

        with patch.object(self.intake.json, "dump", side_effect=fail_after_prefix):
            status = self.intake.main([
                "--input", str(self.source), "--expected-sha256", self.sha,
                "--private-root", str(private), "--output", str(output),
            ])
        self.assertEqual(status, 1)
        self.assertFalse(output.exists(), "A failed write must not publish a truncated held package")
        self.assertEqual(list(private.iterdir()), [], "Temporary files must be cleaned up")

    def test_cli_final_name_race_preserves_other_file(self):
        private = self.root / "private"
        private.mkdir()
        output = private / "held.json"

        def competing_claim(_source, destination):
            Path(destination).write_bytes(b"other-process")
            raise FileExistsError("synthetic competing output")

        with patch.object(self.intake.os, "link", side_effect=competing_claim):
            status = self.intake.main([
                "--input", str(self.source), "--expected-sha256", self.sha,
                "--private-root", str(private), "--output", str(output),
            ])
        self.assertEqual(status, 1)
        self.assertEqual(output.read_bytes(), b"other-process")
        self.assertEqual(list(private.iterdir()), [output], "The unclaimed temporary file must be removed")

    def test_cli_rejects_same_path_and_repository_destination(self):
        private = self.root / "private"
        private.mkdir()
        base = [sys.executable, str(SCRIPT), "--input", str(self.source), "--expected-sha256", self.sha]
        same = subprocess.run(base + ["--private-root", str(self.root), "--output", str(self.source)], capture_output=True, text=True)
        self.assertNotEqual(same.returncode, 0)
        self.assertEqual(hashlib.sha256(self.source.read_bytes()).hexdigest(), self.sha)
        repo_dest = SCRIPT.parents[1] / "tests" / "forbidden-intake-output.json"
        self.assertFalse(repo_dest.exists())
        in_repo = subprocess.run(base + ["--private-root", str(SCRIPT.parents[1]), "--output", str(repo_dest)], capture_output=True, text=True)
        self.assertNotEqual(in_repo.returncode, 0)
        self.assertFalse(repo_dest.exists())

    def test_cli_rejects_a_different_repository_or_hosted_source(self):
        for marker in (".git", ".openai/hosting.json"):
            with self.subTest(marker=marker):
                checkout = self.root / marker.replace("/", "-").replace(".", "")
                checkout.mkdir()
                metadata = checkout / marker
                metadata.parent.mkdir(parents=True, exist_ok=True)
                metadata.write_text("synthetic marker", encoding="utf-8")
                output = checkout / "held.json"
                result = subprocess.run([sys.executable, str(SCRIPT), "--input", str(self.source),
                    "--expected-sha256", self.sha, "--private-root", str(checkout), "--output", str(output)],
                    capture_output=True, text=True)
                self.assertNotEqual(result.returncode, 0)
                self.assertFalse(output.exists())
    def test_cli_rejects_symlink_escape_when_supported(self):
        private = self.root / "private"
        private.mkdir()
        outside = self.root / "outside"
        outside.mkdir()
        link = private / "linked"
        try:
            link.symlink_to(outside, target_is_directory=True)
        except (OSError, NotImplementedError) as error:
            self.skipTest(f"local symlink creation unavailable: {error}")
        output = link / "manifest.json"
        process = subprocess.run(
            [sys.executable, str(SCRIPT), "--input", str(self.source), "--expected-sha256", self.sha,
             "--private-root", str(private), "--output", str(output)], capture_output=True, text=True)
        self.assertNotEqual(process.returncode, 0)
        self.assertFalse((outside / "manifest.json").exists())


if __name__ == "__main__":
    unittest.main()
