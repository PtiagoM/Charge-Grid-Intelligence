"""Fetch only the public PVDAQ system-10 daily files needed for the 2019 overlap."""

from __future__ import annotations

import argparse
import shutil
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path


BUCKET = "https://oedi-data-lake.s3.amazonaws.com/"
PREFIX = "pvdaq/csv/pvdata/system_id=10/year=2019/"
NAMESPACE = {"s3": "http://s3.amazonaws.com/doc/2006-03-01/"}


def download(output_dir: Path) -> tuple[int, int]:
    query = urllib.parse.urlencode({"list-type": "2", "prefix": PREFIX, "max-keys": "1000"})
    with urllib.request.urlopen(BUCKET + "?" + query, timeout=30) as response:
        root = ET.parse(response).getroot()
    if root.findtext("s3:IsTruncated", namespaces=NAMESPACE) == "true":
        raise ValueError("PVDAQ listing is truncated; refusing an incomplete source date range")
    keys = [node.text for node in root.findall("s3:Contents/s3:Key", NAMESPACE)]
    selected = []
    for key in keys:
        name = key.rsplit("/", 1)[-1]
        if not name.startswith("system_10__date_") or not name.endswith(".csv"):
            continue
        try:
            sample_day = date.fromisoformat(name.removeprefix("system_10__date_")[:-4].replace("_", "-"))
        except ValueError:
            continue
        if date(2019, 4, 1) <= sample_day <= date(2019, 12, 16):
            selected.append((sample_day, key))

    output_dir.mkdir(parents=True, exist_ok=True)
    downloaded = total_bytes = 0
    for sample_day, key in sorted(selected):
        target = output_dir / f"pvdaq-system10-{sample_day.isoformat()}.csv"
        if target.exists():
            total_bytes += target.stat().st_size
            continue
        with urllib.request.urlopen(BUCKET + urllib.parse.quote(key, safe="/="), timeout=60) as response:
            with target.with_suffix(".csv.part").open("wb") as output:
                shutil.copyfileobj(response, output)
        target.with_suffix(".csv.part").replace(target)
        downloaded += 1
        total_bytes += target.stat().st_size
    return downloaded, total_bytes


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=Path(".local/ai-03/pvdaq"))
    args = parser.parse_args()
    downloaded, total_bytes = download(args.output_dir)
    print(f"Downloaded {downloaded} PVDAQ files; local sample set is {total_bytes} bytes in {args.output_dir}")


if __name__ == "__main__":
    main()
