# SSC CGL + CHSL Tier I — Previous Year Question Papers (2016–2025)

Verified, one-shift-per-file repository of **SSC CGL** and **SSC CHSL** Tier I (CBE) question papers for the **last 10 completed exam calendar years (2016–2025)**. Built 2026-08-24 on branch `arena/01a032e9-ssc`.

## ⚠️ Status: HONEST BEST-EFFORT — NOT COMPLETE COVERAGE

- **12 complete verified shift files** exist (CGL: 3 × 2023 + 3 × 2025; CHSL: 6 × Aug-2023). One separate partial memory-based file preserves 17 confidently attributed CHSL 2024 stems (14 Quant and 3 General Awareness); it is not counted as a complete shift. Every remaining documented expected shift is listed as **MISSING** in the per-year `metadata.json` schedules and in the tables below — missing is documented, never hidden.
- **No question was invented, completed, simplified or paraphrased.** Anything not recoverable from a source's text layer (image-only question bodies, page-boundary losses, the 30-page PDF parse limit) is marked `[NOT RECOVERABLE: <exact reason>]` in place.
- **No `correct_answer` is set anywhere.** SSC's answer keys are login-gated per candidate and no machine-accessible consolidated key exists in this environment; candidate "Chosen Option" values and Adda247's embedded ✓/X key-marks are recorded in `answer_note` as *reference only* and are explicitly UNVERIFIED against the SSC official key.
- Unverified complete candidates are **not** present. Clearly labelled partial recoveries may be present, but they are never counted as complete/verified shifts.

## Repository layout

```
SSC-CGL/{2016..2025}/            one folder per calendar year
    metadata.json                 expected-shift schedule + evidence + conflicts + collected papers
    YYYY-MM-DD_Shift-N.json       ONE SHIFT = ONE FILE
SSC-CHSL/{2016..2025}/           (same layout)
verification/CGL_verification.md  full verification log (methodology, per-file log, conflicts, corrections)
verification/CHSL_verification.md (same for CHSL, incl. the Aug-2023 per-shift PDF map)
verification/SSC_Portal_audit.md  SSC Portal inventory, provenance classification and skip decisions
verification/source_ledger.md      multi-source discovery ledger and recovery statuses
tools/schema.json                 JSON schema for paper files
tools/validate.py                 structure/field/numbering/options/answer validator
tools/fingerprint.py              cross-file duplication / mislabel detection
tools/coverage.py                 expected-vs-collected audit (+ --sync for metadata paper lists)
```

**File naming:** `YYYY-MM-DD_Shift-N.json` (exam date + shift). Years containing two different exams (CGL 2022: Apr + Dec 2022; CHSL 2023: Mar + Aug 2023) keep the exam's own calendar year/date in the filename, documented in that year's `metadata.json`.

## Coverage (output of `python3 tools/coverage.py`, 2026-08-24)

`Expected Shifts` = shifts documented as expected in `metadata.json` from source evidence. `(+Nd)` = an additional N exam days inside a documented window whose **per-day shift schedule is not established** (listed per-day as `expected_shifts: null` — documented unknowns, not counted). 2018 (CGL) had no Tier I exam; the 2020 CGL row counts the March-2020 Tier I of the CGL 2019-20 cycle (correction documented in `verification/CGL_verification.md` §9).

| Exam | Year | Expected Shifts | Collected | Verified | Missing | Unverified |
|------|------|-----------------|-----------|----------|---------|------------|
| SSC CGL | 2016 | 0 (+18d) | 0 | 0 | 0 | 0 |
| SSC CGL | 2017 | 0 (+20d) | 0 | 0 | 0 | 0 |
| SSC CGL | 2018 | 0 (not conducted) | 0 | 0 | 0 | 0 |
| SSC CGL | 2019 | 21 (+1d) | 0 | 0 | 21 | 0 |
| SSC CGL | 2020 | 18 | 0 | 0 | 18 | 0 |
| SSC CGL | 2021 | 8 (+8d) | 0 | 0 | 8 | 0 |
| SSC CGL | 2022 | 40 (+14d) | 0 | 0 | 40 | 0 |
| SSC CGL | 2023 | 39 | 3 | 3 | 36 | 0 |
| SSC CGL | 2024 | 36 | 0 | 0 | 36 | 0 |
| SSC CGL | 2025 | 46 | 3 | 3 | 43 | 0 |
| **SSC CGL** | **Total** | **208** | **6** | **6** | **202** | **0** |
| SSC CHSL | 2016 | 0 (+29d) | 0 | 0 | 0 | 0 |
| SSC CHSL | 2017 | 0 (+33d) | 0 | 0 | 0 | 0 |
| SSC CHSL | 2018 | 0 (+48d) | 0 | 0 | 0 | 0 |
| SSC CHSL | 2019 | 0 (+26d) | 0 | 0 | 0 | 0 |
| SSC CHSL | 2020 | 0 (+18d) | 0 | 0 | 0 | 0 |
| SSC CHSL | 2021 | 0 (+17d) | 0 | 0 | 0 | 0 |
| SSC CHSL | 2022 | 0 (+18d) | 0 | 0 | 0 | 0 |
| SSC CHSL | 2023 | 40 (+4d) | 6 | 6 | 34 | 0 |
| SSC CHSL | 2024 | 36 | 0 | 0 | 36 | 0 |
| SSC CHSL | 2025 | 0 (+19d) | 0 | 0 | 0 | 0 |
| **SSC CHSL** | **Total** | **76** | **6** | **6** | **70** | **0** |
| **Both** | **Total** | **284** | **12** | **12** | **272** | **0** |

## Recovery status counts (kept separate)

| Category | CGL | CHSL | Total |
|---|---:|---:|---:|
| Complete verified | 6 | 6 | 12 |
| Complete memory-based (additional) | 0 | 0 | 0 |
| Partial verified | 0 | 0 | 0 |
| Partial memory-based | 0 | 1 | 1 |
| Unverified complete candidates | 0 | 0 | 0 |
| Missing documented shifts | 202 | 70 | 272 |

The partial file is `SSC-CHSL/2024/2024-07-04_Shift-1_PARTIAL.json`; it contains 14 Quant stems, no recoverable options, and is not counted as a complete paper.

## JSON schema (paper files)

```jsonc
{
  "exam": "SSC CGL", "year": 2023, "tier": "Tier I",
  "date": "2023-07-14", "shift": "Shift-1",
  "source": "full URL + header evidence + access date",
  "corroborating_sources": [{"name": "...", "url": "...", "note": "..."}],
  "source_type": "MEMORY-BASED",            // OFFICIAL | MEMORY-BASED | RECONSTRUCTED
  "verification_status": "verified",         // verified files only; nothing unverified is stored as data
  "notes": "PARTIAL-CONTENT disclosure, section order, unattributed fragments, answer policy ...",
  "questions": [{
    "question_number": 1,                    // continuous 1-100
    "subject": "General Awareness",
    "question_id": "264330xxxxxx",           // original SSC CBE ID where the source provides one (else null)
    "question": "verbatim, or [NOT RECOVERABLE: reason]",
    "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
    "correct_answer": null,                  // never set unless a machine-accessible explicit key exists
    "answer_source": null,
    "answer_note": "candidate response / key-mark artifacts (reference only) / not-recoverable reasons"
  }]
}
```

## Verification methodology (summary)

1. **Date+shift proven from the document itself** (CBE headers: exam date, shift time, venue, per-question SSC IDs) + **≥1 independent corroboration**.
2. **Verbatim transcription** — source typos preserved (`sic`), no rewriting/AI completion; missing spans marked `[NOT RECOVERABLE: …]` with the exact reason.
3. **Mechanical audits** — `validate.py` (fields, numbering, options, answers), `fingerprint.py` (cross-file duplication/mislabeling; all 7 observed groups explained in the verification logs), `coverage.py` (expected vs collected).
4. **Source taxonomy** — only genuine CBE exam-screen captures / response-sheet exports (Adda247 CBE exports; Oliveboard challenge-module sheets) are used as verified data. Coaching "Similar Paper"/memory-based compilations are RECONSTRUCTED and were never used as verified data.
5. **Conflict rule** — when sources disagree (shift sets, day lists, shift counts, option text), the conflict is flagged in the file/metadata and never silently resolved.

Full details, per-file logs, the source investigation log, conflict registers and the correction log: [`verification/CGL_verification.md`](verification/CGL_verification.md) and [`verification/CHSL_verification.md`](verification/CHSL_verification.md).

## Known limitations (honest)

- **Answer verification:** impossible in this environment (login-gated SSC keys) → all answers null by policy.
- **Text-layer limits:** many CBE exports render question bodies/figures as images (especially Reasoning/Quant/GA) → those spans are NOT RECOVERABLE, not guessed. Oliveboard response-sheet PDFs hit a 30-page parse limit → CGL 2025 files recover PART-A/B + early PART-C only.
- **Access limits:** several Adda247 S3 objects were intermittently throttled (`AccessDenied`); Oliveboard's per-shift PDFs (except 12-Sep-2025) are form-gated; two Collegedekho mirrors are dead. Those shifts remain MISSING rather than approximated.
- **Older years (2016–2021):** only window-level schedules are documented from accessible sources; per-day shift schedules are marked unknown (`null`) and were not invented.
- **Flagged open conflicts:** CGL 2023 25-Jul shift set; CGL 2019 day count; CHSL 2023 Aug-5 (Shiksha) vs the 10-day PDF map; CHSL 2024 3-vs-4 shifts/day; CHSL 2025 start date; CHSL 2017-18 window — see the verification logs.

## Re-auditing

```bash
python3 tools/validate.py         # all paper files must pass
python3 tools/coverage.py         # expected vs collected per year
python3 tools/coverage.py --sync  # re-sync metadata 'papers' arrays with disk
python3 tools/fingerprint.py      # duplication / mislabel detection
```
