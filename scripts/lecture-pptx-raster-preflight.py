"""Read-only raster-byte checks before the trusted local presentation renderer."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import zipfile
import zlib


def require(condition, message):
    if not condition:
        raise ValueError(message)


def raster(data, content_type):
    if content_type == "image/png":
        require(len(data) >= 45 and data[:8] == b"\x89PNG\r\n\x1a\n", "PNG source signature is invalid")
        require(data[8:16] == b"\0\0\0\rIHDR", "PNG source IHDR is invalid")
        require(zlib.crc32(data[12:29]) == struct.unpack(">I", data[29:33])[0], "PNG source IHDR checksum is invalid")
        require(data[-12:] == b"\0\0\0\0IEND\xaeB`\x82", "PNG source is incomplete or has trailing data")
        width, height = struct.unpack(">II", data[16:24])
        depths = {0: (1, 2, 4, 8, 16), 2: (8, 16), 3: (1, 2, 4, 8), 4: (8, 16), 6: (8, 16)}
        require(data[24] in depths.get(data[25], ()) and data[26:28] == b"\0\0" and data[28] <= 1, "Unsupported PNG header")
    elif content_type == "image/jpeg":
        require(len(data) >= 12 and data[:2] == b"\xff\xd8" and data[-2:] == b"\xff\xd9", "JPEG source signature is invalid")
        position, width, height = 2, 0, 0
        while position < len(data) - 2:
            require(data[position] == 255, "Invalid JPEG marker")
            while position < len(data) and data[position] == 255:
                position += 1
            require(position < len(data), "Incomplete JPEG marker")
            marker = data[position]
            position += 1
            if marker == 0xDA:
                break
            require(marker not in (0, 0xD8, 0xD9) and position + 2 <= len(data), "Unsupported JPEG marker")
            length = int.from_bytes(data[position:position + 2], "big")
            require(length >= 2 and position + length <= len(data), "Incomplete JPEG segment")
            if marker in (0xC0, 0xC1, 0xC2):
                require(width == 0 and length >= 8 and data[position + 2] == 8, "Unsupported or repeated JPEG frame")
                height = int.from_bytes(data[position + 3:position + 5], "big")
                width = int.from_bytes(data[position + 5:position + 7], "big")
            position += length
        require(width > 0 and height > 0, "JPEG dimensions are unavailable")
    else:
        raise ValueError("Only PNG/JPEG media may reach the renderer")
    require(0 < width <= 4096 and 0 < height <= 4096 and width * height <= 16_000_000, "Source raster dimensions exceed render limits")
    return width, height


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--intake", required=True, type=Path)
    parser.add_argument("--intake-sha256", required=True)
    parser.add_argument("--source-sha256", required=True)
    args = parser.parse_args()
    require(args.input.is_absolute() and args.intake.is_absolute(), "Absolute snapshot and intake paths required")
    require(args.intake.stat().st_size <= 64 * 1024 * 1024 and args.input.stat().st_size <= 256 * 1024 * 1024, "Source or intake exceeds limits")
    packet_bytes = args.intake.read_bytes()
    require(hashlib.sha256(packet_bytes).hexdigest() == args.intake_sha256, "Intake changed before raster checks")
    packet = json.loads(packet_bytes)
    require(packet["source"]["sha256"] == args.source_sha256 and len(packet["assets"]) <= 20000, "Raster source pin/count differs")
    records = []
    with args.input.open("rb") as source:
        require(hashlib.file_digest(source, "sha256").hexdigest() == args.source_sha256, "Snapshot changed before raster checks")
        source.seek(0)
        with zipfile.ZipFile(source) as archive:
            for item in packet["assets"]:
                require(0 < item["bytes"] <= 64 * 1024 * 1024, "Raster asset exceeds limits")
                require(archive.getinfo(item["part"]).file_size == item["bytes"], "Raster asset size differs")
                data = archive.read(item["part"])
                require(len(data) == item["bytes"] and hashlib.sha256(data).hexdigest() == item["sha256"], "Raster asset changed")
                width, height = raster(data, item["contentType"])
                records.append({"part": item["part"], "sha256": item["sha256"], "bytes": len(data), "contentType": item["contentType"], "width": width, "height": height})
        source.seek(0)
        require(hashlib.file_digest(source, "sha256").hexdigest() == args.source_sha256, "Snapshot changed during raster checks")
    print(json.dumps({"schema": "vm-pptx-raster-preflight-v1", "sourceSha256": args.source_sha256, "intakeSha256": args.intake_sha256, "assets": records, "fullPixelDecodeVerified": False, "approved": False}))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, KeyError, zipfile.BadZipFile) as error:
        raise SystemExit("Raster preflight refused: " + str(error))
