#!/usr/bin/env python3
"""Duplicate / mislabeling detection across all collected papers.

Question fingerprint = sha1 over normalized (lowercased, punctuation/whitespace
stripped) question text + all option texts.

Reports:
  1. Exact duplicate question texts appearing in >1 file (expected between
     shifts of the same series, but flagged for review).
  2. Pairwise overlap ratio within each exam+year:
     - same date+shift with high overlap   => probable DUPLICATE FILE
     - same date, different shift, high    => possible MISLABELING
     - different dates, very high overlap  => cross-check
  3. Files whose full question sets are byte-identical in fingerprint.
"""
import hashlib
import json
import os
import re
import sys
from itertools import combinations

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def norm(s):
    return re.sub(r'[^a-z0-9]+', '', str(s).lower())


def qfp(q):
    opts = q.get("options", {}) or {}
    parts = [norm(q.get("question", ""))]
    for k in sorted(opts):
        parts.append(norm(opts[k]))
    return hashlib.sha1("|".join(parts).encode()).hexdigest()


def load_papers():
    papers = []
    for exam in ("SSC-CGL", "SSC-CHSL"):
        base = os.path.join(ROOT, exam)
        if not os.path.isdir(base):
            continue
        for root, _, files in os.walk(base):
            for f in sorted(files):
                if not f.endswith(".json") or f == "metadata.json":
                    continue
                p = os.path.join(root, f)
                try:
                    with open(p, encoding="utf-8") as fh:
                        d = json.load(fh)
                except Exception as e:
                    print(f"SKIP {os.path.relpath(p, ROOT)}: {e}")
                    continue
                papers.append({
                    "path": p,
                    "exam": exam,
                    "year": d.get("year"),
                    "date": d.get("date"),
                    "shift": d.get("shift"),
                    "fps": [qfp(q) for q in d.get("questions", []) if isinstance(q, dict)],
                })
    return papers


def main():
    papers = load_papers()
    print(f"Loaded {len(papers)} paper files\n")
    if not papers:
        return

    by_fp = {}
    for p in papers:
        for fp in p["fps"]:
            by_fp.setdefault(fp, set()).add(os.path.relpath(p["path"], ROOT))
    cross = {fp: ps for fp, ps in by_fp.items() if len(ps) > 1}
    print(f"Distinct question fingerprints: {len(by_fp)}; "
          f"appearing in >1 file: {len(cross)}\n")

    for exam in ("SSC-CGL", "SSC-CHSL"):
        group = [p for p in papers if p["exam"] == exam]
        print(f"--- pairwise overlap, {exam} (within year) ---")
        reported = 0
        for a, b in combinations(group, 2):
            if a["year"] != b["year"] or a["year"] is None:
                continue
            sa, sb = set(a["fps"]), set(b["fps"])
            if not sa or not sb:
                continue
            inter = len(sa & sb)
            ratio = inter / min(len(sa), len(sb))
            same_shift = a["date"] == b["date"] and a["shift"] == b["shift"]
            same_date = a["date"] == b["date"]
            tag = ""
            if same_shift:
                tag = "   <<< DUPLICATE FILE (same date+shift, twice)"
            elif same_date and ratio > 0.5:
                tag = "   <<< DIFFERENT SHIFTS SAME DATE, HIGH OVERLAP - CHECK MISLABELING"
            elif ratio > 0.7:
                tag = "   <<< HIGH OVERLAP ACROSS DATES - CHECK"
            if inter and (ratio > 0.1 or tag):
                reported += 1
                print(f"[{a['year']}] overlap {inter}/{min(len(sa), len(sb))} "
                      f"({ratio:.0%})  {a['date']} {a['shift']}  vs  {b['date']} {b['shift']}{tag}")
        if reported == 0:
            print("  (none)")
        print()

    print("--- exact-identical paper sets (same fingerprint multiset) ---")
    seen = {}
    for p in papers:
        key = hashlib.sha1("|".join(sorted(set(p["fps"]))).encode()).hexdigest()
        seen.setdefault(key, []).append(os.path.relpath(p["path"], ROOT))
    exact = {k: v for k, v in seen.items() if len(v) > 1}
    if exact:
        for v in exact.values():
            print("IDENTICAL:", v)
    else:
        print("  (none)")


if __name__ == "__main__":
    main()
