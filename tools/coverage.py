#!/usr/bin/env python3
"""Coverage audit: expected shifts (per-year metadata.json) vs collected files.

Usage:
  python3 tools/coverage.py            # audit both exams
  python3 tools/coverage.py --sync     # also rewrite 'papers' arrays in
                                       # metadata.json to match files on disk
  python3 tools/coverage.py SSC-CGL    # one exam

metadata.json format (per exam/year):
{
  "exam": "SSC CGL", "year": 2024, "tier": "Tier I",
  "conducted": true,
  "notes": "...",
  "schedule": [
    {"date": "2024-06-09",
     "expected_shifts": ["Shift-1", "Shift-2", "Shift-3"],
     "source": "url of the notice that establishes this date/shifts"},
    {"date": "2016-09-03",
     "expected_shifts": null,   # exam day inside a documented window, but the
                                # per-day shift schedule was NOT established
  ],
  "papers": [ {"file": "...", "date": "...", "shift": "Shift-1", "status": "verified"} ]
}
"conducted": false is used for years the exam was not held (with notes).
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMS = {"SSC-CGL": "SSC CGL", "SSC-CHSL": "SSC CHSL"}
FILE_RE = re.compile(r'^(\d{4})-(\d{2})-(\d{2})_Shift-(\d+)\.json$')


def scan(exam_dir):
    """Return dict {(year, date, shift): {file, status, yeardir}} of shift files."""
    out = {}
    dups = []
    base = os.path.join(ROOT, exam_dir)
    if not os.path.isdir(base):
        return out, dups
    for year in sorted(os.listdir(base)):
        if not year.isdigit():
            continue
        yd = os.path.join(base, year)
        if not os.path.isdir(yd):
            continue
        for f in sorted(os.listdir(yd)):
            if f == "metadata.json":
                continue
            m = FILE_RE.match(f)
            if not m:
                continue
            key = (year, f"{m.group(1)}-{m.group(2)}-{m.group(3)}", f"Shift-{m.group(4)}")
            rec = {"file": f"{exam_dir}/{year}/{f}", "status": "?"}
            if key in out:
                dups.append(key)
            try:
                with open(os.path.join(yd, f), encoding="utf-8") as fh:
                    d = json.load(fh)
                rec["status"] = d.get("verification_status", "?")
            except Exception:
                pass
            out[key] = rec
    return out, dups


def sync_metadata(exam_dir, all_files):
    base = os.path.join(ROOT, exam_dir)
    for year in sorted(os.listdir(base)) if os.path.isdir(base) else []:
        if not year.isdigit():
            continue
        meta_path = os.path.join(base, year, "metadata.json")
        if not os.path.exists(meta_path):
            continue
        with open(meta_path, encoding="utf-8") as fh:
            meta = json.load(fh)
        papers = []
        for (y, d, s), rec in sorted(all_files.items()):
            if y != year:
                continue
            papers.append({"file": rec["file"].split("/")[-1], "date": d,
                           "shift": s, "status": rec["status"]})
        meta["papers"] = papers
        with open(meta_path, "w", encoding="utf-8") as fh:
            json.dump(meta, fh, indent=2, ensure_ascii=False)
            fh.write("\n")


def audit(exam_dir):
    exam = EXAMS[exam_dir]
    base = os.path.join(ROOT, exam_dir)
    years = sorted(d for d in os.listdir(base) if d.isdigit()) if os.path.isdir(base) else []
    all_files, dups = scan(exam_dir)
    print(f"\n=== {exam} ===")
    print("| Year | Expected Shifts | Collected | Verified | Unverified | Missing | Duplicate files |")
    print("|------|-----------------|-----------|----------|------------|---------|-----------------|")
    t = [0, 0, 0, 0, 0, 0]
    for year in years:
        meta_path = os.path.join(base, year, "metadata.json")
        exp = 0
        und = 0  # exam days in documented window whose per-day shift schedule is NOT established
        if os.path.exists(meta_path):
            try:
                with open(meta_path, encoding="utf-8") as fh:
                    meta = json.load(fh)
                for s in meta.get("schedule", []):
                    e = s.get("expected_shifts", [])
                    if e is None:
                        und += 1
                    else:
                        exp += len(e)
            except Exception:
                exp = -1
        year_keys = [k for k in all_files if k[0] == year]
        ncol = len(year_keys)
        nver = sum(1 for k in year_keys if all_files[k]["status"] == "verified")
        nunv = sum(1 for k in year_keys if all_files[k]["status"] == "unverified")
        missing = exp - ncol if exp >= 0 else -1
        dup = sum(1 for (y, _, _) in dups if y == year)
        exp_cell = f"{exp} (+{und}d)" if und else (exp if exp >= 0 else "?")
        print(f"| {year} | {exp_cell} | {ncol} | {nver} | {nunv} | {missing} | {dup} |")
        t[0] += exp
        t[1] += ncol
        t[2] += nver
        t[3] += nunv
        t[4] += missing
        t[5] += dup
    print(f"| **TOTAL** | **{t[0]}** | **{t[1]}** | **{t[2]}** | **{t[3]}** | **{t[4]}** | **{t[5]}** |")

    print("\nMissing / unverified detail:")
    for year in years:
        meta_path = os.path.join(base, year, "metadata.json")
        if not os.path.exists(meta_path):
            print(f"  {year}: NO metadata.json (expected schedule not documented yet)")
            continue
        try:
            with open(meta_path, encoding="utf-8") as fh:
                meta = json.load(fh)
        except Exception as e:
            print(f"  {year}: metadata.json unreadable: {e}")
            continue
        if meta.get("conducted") is False:
            print(f"  {year}: exam NOT conducted this year ({meta.get('notes', 'no note')})")
            continue
        for s in meta.get("schedule", []):
            e = s.get("expected_shifts", [])
            if e is None:
                print(f"  UNDOCUMENTED: {year} {s['date']} (exam day in documented window; per-day shift schedule not established)")
                continue
            for sh in e:
                k = (year, s["date"], sh)
                if k not in all_files:
                    print(f"  MISSING:    {year} {s['date']} {sh}")
                elif all_files[k]["status"] != "verified":
                    print(f"  UNVERIFIED: {year} {s['date']} {sh}  ({all_files[k]['file']})")
        for (y, d, sh) in sorted(all_files):
            if y != year:
                continue
            in_exp = any(s["date"] == d and sh in (s.get("expected_shifts") or [])
                         for s in meta.get("schedule", []))
            if not in_exp:
                print(f"  UNEXPECTED FILE (not in documented schedule): {all_files[(y, d, sh)]['file']}")
    print()


def main():
    args = [a for a in sys.argv[1:]]
    do_sync = False
    if "--sync" in args:
        do_sync = True
        args = [a for a in args if a != "--sync"]
    exams = args if args else ["SSC-CGL", "SSC-CHSL"]
    for e in exams:
        if e not in EXAMS:
            print(f"unknown exam dir {e}")
            sys.exit(2)
        if do_sync:
            all_files, _ = scan(e)
            sync_metadata(e, all_files)
    for e in exams:
        audit(e)


if __name__ == "__main__":
    main()
