#!/usr/bin/env python3
"""Validate SSC PYQ shift files (JSON schema + internal consistency).

Usage: python3 tools/validate.py [path ...]
  Without arguments, validates every shift file under SSC-CGL/ and SSC-CHSL/
  (metadata.json files are excluded).
Exit code 0 = all pass, 1 = at least one failure.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILE_RE = re.compile(r'^(\d{4})-(\d{2})-(\d{2})_Shift-(\d+)\.json$')
REQUIRED_TOP = ["exam", "year", "tier", "date", "shift", "source",
                "source_type", "verification_status", "questions"]
REQUIRED_Q = ["question_number", "subject", "question", "options",
              "correct_answer", "answer_source"]
FOLDER_EXAMS = {"SSC-CGL": "SSC CGL", "SSC-CHSL": "SSC CHSL"}
SOURCE_TYPES = ("OFFICIAL", "MEMORY-BASED", "RECONSTRUCTED", "OFFICIAL-ANSWER-KEY-ONLY")


def check_options(options):
    """Return sorted option keys if well-formed, else None."""
    if not isinstance(options, dict):
        return None
    keys = list(options.keys())
    for k in keys:
        if not re.fullmatch(r'[A-E]', str(k)):
            return None
    for v in options.values():
        if not isinstance(v, str) or not v.strip():
            return None
    return sorted(keys)


def validate_file(path):
    errors, warnings = [], []
    rel = os.path.relpath(path, ROOT)
    m = FILE_RE.match(os.path.basename(path))
    if not m:
        return [f"filename does not match YYYY-MM-DD_Shift-N.json: {os.path.basename(path)}"], []
    fy, fm, fd, fshift = int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4))
    parts = rel.split(os.sep)
    if len(parts) < 3 or not parts[0].startswith("SSC-") or not parts[1].isdigit():
        return [f"file not under SSC-<EXAM>/<YEAR>/: {rel}"], []
    folder_exam = FOLDER_EXAMS.get(parts[0])
    if folder_exam is None:
        return [f"unknown exam folder {parts[0]}"], []
    folder_year = int(parts[1])
    if not (1 <= fm <= 12 and 1 <= fd <= 31):
        errors.append(f"invalid calendar date in filename")
    if fy != folder_year:
        errors.append(f"filename year {fy} != folder year {folder_year}")
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
    except Exception as e:
        return [f"invalid JSON: {e}"], []
    for f in REQUIRED_TOP:
        if f not in data:
            errors.append(f"missing top-level field '{f}'")
    if errors:
        return errors, warnings
    if data["exam"] != folder_exam:
        errors.append(f"exam '{data['exam']}' != folder exam '{folder_exam}' (CGL/CHSL contamination check)")
    try:
        if int(data["year"]) != folder_year:
            errors.append(f"year {data['year']} != folder year {folder_year}")
    except Exception:
        errors.append("year is not an integer")
    d = str(data["date"])
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', d):
        errors.append(f"bad date format '{d}'")
    else:
        y, mo, da = (int(x) for x in d.split("-"))
        if y != folder_year:
            errors.append(f"date year {y} != folder year {folder_year}")
        if not (1 <= mo <= 12 and 1 <= da <= 31):
            errors.append(f"invalid calendar date '{d}'")
        if d != f"{fy:04d}-{fm:02d}-{fd:02d}":
            errors.append(f"date '{d}' != filename date '{fy:04d}-{fm:02d}-{fd:02d}'")
    if not re.fullmatch(r'Shift-\d+', str(data["shift"])):
        errors.append(f"bad shift value '{data['shift']}'")
    elif data["shift"] != f"Shift-{fshift}":
        errors.append(f"shift '{data['shift']}' != filename shift 'Shift-{fshift}'")
    if data["verification_status"] not in ("verified", "unverified"):
        errors.append("verification_status must be 'verified' or 'unverified'")
    if data["source_type"] not in SOURCE_TYPES:
        errors.append(f"source_type '{data['source_type']}' not in {SOURCE_TYPES}")
    if not str(data.get("source", "")).strip():
        errors.append("source is empty")
    if data["verification_status"] == "verified":
        corr = data.get("corroborating_sources", [])
        if not isinstance(corr, list) or len(corr) < 1:
            errors.append("verified paper must list >=1 independent source in 'corroborating_sources'")
    qs = data["questions"]
    if not isinstance(qs, list) or not qs:
        errors.append("'questions' must be a non-empty array")
        return errors, warnings
    seen = set()
    expected_next = None
    for i, q in enumerate(qs, start=1):
        loc = f"question index {i}"
        for f in REQUIRED_Q:
            if f not in q:
                errors.append(f"{loc}: missing field '{f}'")
        if any(f not in q for f in REQUIRED_Q):
            continue
        qn = q["question_number"]
        if not isinstance(qn, int) or qn < 1:
            errors.append(f"{loc}: question_number must be a positive integer")
            continue
        if qn in seen:
            errors.append(f"{loc}: duplicate question_number {qn}")
        seen.add(qn)
        if expected_next is not None and qn != expected_next:
            errors.append(f"{loc}: question_number {qn} breaks continuity (expected {expected_next})")
        expected_next = qn + 1
        if not isinstance(q.get("question"), str) or not q["question"].strip():
            errors.append(f"{loc} (Q{qn}): empty question text")
        opts = check_options(q.get("options"))
        if opts is None:
            errors.append(f"{loc} (Q{qn}): options must be a dict of non-empty strings keyed A..E")
        else:
            if len(opts) != 4:
                warnings.append(f"{loc} (Q{qn}): {len(opts)} options (expected 4)")
            ca = q.get("correct_answer")
            if ca is not None:
                if not re.fullmatch(r'[A-E]', str(ca)):
                    errors.append(f"{loc} (Q{qn}): correct_answer '{ca}' is not a single letter A-E")
                elif str(ca) not in opts:
                    errors.append(f"{loc} (Q{qn}): correct_answer '{ca}' not among options {opts}")
            if q.get("answer_source") is None or not str(q["answer_source"]).strip():
                if ca is not None:
                    errors.append(f"{loc} (Q{qn}): correct_answer set but answer_source empty")
    if seen and min(seen) != 1:
        warnings.append(f"question numbering starts at {min(seen)} (expected 1)")
    return errors, warnings


def main():
    targets = sys.argv[1:]
    if not targets:
        for exam in ("SSC-CGL", "SSC-CHSL"):
            base = os.path.join(ROOT, exam)
            if not os.path.isdir(base):
                continue
            for root, _, files in os.walk(base):
                for f in sorted(files):
                    if f.endswith(".json") and f != "metadata.json":
                        targets.append(os.path.join(root, f))
    failed = 0
    for p in sorted(set(targets)):
        errors, warnings = validate_file(p)
        rel = os.path.relpath(p, ROOT)
        if errors:
            failed += 1
            print(f"FAIL {rel}")
            for e in errors:
                print(f"   - {e}")
            for w in warnings:
                print(f"   ~ {w}")
        else:
            print(f"PASS {rel}")
            for w in warnings:
                print(f"   ~ {w}")
    print(f"\n{len(set(targets)) - failed}/{len(set(targets))} files passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
