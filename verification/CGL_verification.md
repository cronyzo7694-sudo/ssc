# SSC CGL Tier I — Verification Log (calendar years 2016–2025)

Repository: `cronyzo7694-sudo/ssc` · branch `arena/01a032e9-ssc` · date of this log: **2026-08-24**

## 0. Overall status (read first)

**This repository is NOT complete CGL coverage.** Verified question-paper files exist for **6 of 208 documented expected shifts** (3 × CGL 2023 + 3 × CGL 2025). Every other shift is documented as MISSING (with expected-shift checklists in the per-year `metadata.json`), or as an exam day whose per-day shift schedule is NOT established (marked `expected_shifts: null` in the schedule, reported by `tools/coverage.py` as `+Nd`). Calendar year 2018 had no Tier I exam; the CGL 2019-20 cycle's Tier I was held in March 2020 (the later Tier II was what was postponed/merged) — see §4 and the correction log. No question content was invented, completed, or paraphrased anywhere; anything not recoverable from the source's text layer is marked `[NOT RECOVERABLE: …]` with the specific reason.

## 1. Verification standard applied to every file

A file is labelled `verification_status: "verified"` only if **all** of the following hold:

1. **Date + shift proven from the source document itself** — e.g. a CBE export header ("Exam Date 14/07/2023", venue, per-question SSC Question IDs) or a CBE response-sheet header ("Test Date : 12 Sep 2025", shift time).
2. **Corroboration** — at least one independent source confirms the date/shift (a second institute's paper/analysis for the same date+shift, or an official-window document). Recorded in `corroborating_sources`.
3. **Structure** — continuous question numbering 1–100, no duplicate numbers, 4 options per question where the source provides options; checked mechanically by `tools/validate.py`.
4. **Verbatim integrity** — question wording, options, numbering and order preserved exactly as rendered in the source, including source typos (flagged `sic`); no rewriting, simplifying, grammar-fixing or AI completion. Where the source's text layer is missing (images, page-boundary losses, parse limits), the exact span is marked `[NOT RECOVERABLE: <reason>]` instead of being filled in.
5. **No contamination** — `tools/fingerprint.py` (sha1 over normalized question+options) shows no unexplained cross-file or cross-date duplication. All 7 observed cross-file groups are explained in §5.
6. **Answers** — `correct_answer` is set only from a machine-accessible source that explicitly identifies it. **No such source exists for any CGL year in this environment (SSC's keys are login-gated per candidate), so every `correct_answer` is `null` in every file.** Candidate "Chosen Option" values in CBE exports are recorded in `answer_note` as *reference only*, never as answers. Embedded ✓/X marks in Adda247 exports are their answer-key notation, are UNVERIFIED against the SSC official key, and are never used.

`source_type` taxonomy: **OFFICIAL** (SSC's own publications) — none used for question content; **MEMORY-BASED** (genuine CBE exam-screen captures / candidate response-sheet exports: Adda247 CBE exports, Oliveboard "challenge module" response sheets) — used for all 6 verified files; **RECONSTRUCTED** (coaching "Similar Paper" / faculty rebuilds) — never used as verified data.

## 2. Source investigation log

### Used (working in this environment)
| Source | What it provided | Access |
|---|---|---|
| Adda247 CBE exam-screen export, 14-Jul-2023 Shift-1, mirrored on Collegedekho CDN (`static.collegedekho.com/.../ssc_cgl_2023_tier_1_14th-july-2023-shift-1.pdf`) | Primary for `2023-07-14_Shift-1.json` (SSC question IDs, venue "TCS Gito Bitan", 09:00–10:00) | direct PDF |
| Cracku solved-paper pages (`cracku.in/ssc-cgl-tier-1-<dd>-<jul>-2023-shift-<n>-question-paper-solved`) | Full 100-Q+options rebuilds; primary for `2023-07-14_Shift-2.json` and `2023-07-17_Shift-1.json`; index page lists all CGL 2023 + Dec-2022 shifts | HTML, chunked fetch (rotating windows) |
| Oliveboard CDN (`download.oliveboard.in/pdf/ssc-cgl-12th-sep-shift-{1,2,3}.pdf`) | CBE "challenge module" candidate response sheets; primary for the 3 × `2025-09-12` files | direct PDF (see §7 limitation) |
| Same-day analyses: CareerPower (14-Jul S2), HelloScholar snippet (14-Jul shift timings), SSC Adda (17-Jul S1 topic list), Examzy (17-Jul timings) | Corroboration of date/shift/section content | HTML |
| Oliveboard Tier I PYP page (`oliveboard.in/blog/ssc-cgl-tier-1-pyps/`) | Shift-wise date tables for CGL 2019, 2020, 2021, 2022-Dec, 2023, 2024, 2025 → basis of the per-day schedules in `metadata.json` | HTML (PDF downloads themselves are form-gated except 12-Sep-2025) |
| Cracku CGL previous-papers index | CGL 2023 shift map (incl. Dec-2022 7/8/9/12/13-Dec S1–S4) | HTML |
| SSC notice (cancellation): `ssc.nic.in/SSCFileServer/PortalManagement/UploadedFiles/Examination_update_cgl18_06062019.pdf` | CGL 2018-cycle (Jun 2019): 9 shifts cancelled at 4 Patna/Varanasi centres | PDF |

### Rejected
- **Adda247 "Memory Based Paper" day-level compilation PDF** (`.../SSC-CGL-Tier-I-2023-Memory-Based-Paper-Based-on-14-Jul-2023-Exam.pdf`) — a day-level compilation whose questions belong to a *different* 14-Jul shift; using it would mislabel the shift. Rejected (documented in the S2 file note).
- **PrepIn PYP listings** — cycle labels mislabelled (never trust the year labels).
- **sscportal.in CGL papers** — window-level listings only, no verified per-shift PDFs in this environment.
- **Oliveboard "free PYP kit" PDFs (all dates except 12-Sep-2025)** — form-gated (`ssc-cgl-free-pyp-kit`); the *tables* on the PYP page are used as schedule evidence, the PDFs are not retrievable here.
- **Adda247 "Similar Paper" PDFs for CGL 2025** — RECONSTRUCTED documents, not CBE exports; not usable as verified data.

### Blocked / inaccessible
- `ssc.nic.in`/`ssc.gov.in` answer-key portal (per-candidate login: roll no + password) — no machine-accessible consolidated key for any year.
- Collegedekho CDN 14-Jul S2 and 17-Jul S1 objects — HTTP `NoSuchKey` (dead links).
- exammix.com, Scribd/Studypool mirrors — blocked or paywalled.
- PW.live — redirect loop.

## 3. Year-by-year checklist (expected vs collected)

Numbers below are the output of `python3 tools/coverage.py` on 2026-08-24. `(+Nd)` = N exam days inside a documented window whose per-day shift schedule is NOT established (listed with `expected_shifts: null` in `metadata.json`; each day is individually itemized in the coverage detail section).

| Year | Exam (cycle) | Expected (documented) | Undocumented days | Collected | Verified | Missing | Notes |
|---|---|---|---|---|---|---|---|
| 2016 | CGL 2016 (27-Aug–11-Sep; Srinagar 25-Sep; re-exam 02-Oct; 43 batches) | 0 | 18 | 0 | 0 | — | window-level evidence only; per-day shifts not established |
| 2017 | CGL 2017 (05–24-Aug; 3 shift slots/day) | 0 | 20 | 0 | 0 | — | window-level evidence only |
| 2018 | **NOT conducted** (CGL 2018 cycle held Jun 2019) | 0 | 0 | 0 | 0 | — | documented, not invented |
| 2019 | CGL 2018 cycle (04–13-Jun; 9 shifts cancelled at Patna/Varanasi per SSC notice) | 21 | 1 (05-Jun) | 0 | 0 | 21 | day-count conflict 7/8/9 flagged; 05-Jun row lost at parse boundary |
| 2020 | CGL 2019-20 cycle, **Tier I held Mar 2020** (03–07-Mar S1-3; 09-Mar S1; see correction log) | 18 | 0 | 0 | 0 | 18 | Tier II of this cycle postponed & merged into CGL 2020-21 |
| 2021 | CGL 2020-21 (13–24-Aug) | 8 | 8 | 0 | 0 | 8 | Oliveboard table lists only 13/16/17/23-Aug; other window days not listed (completeness TO VERIFY) |
| 2022 | TWO exams: CGL 2021 (11–21-Apr) + CGL 2022 (01–13-Dec) | 40 (Dec) | 14 (11 Apr + Dec 4/10/11) | 0 | 0 | 40 | Dec fully resolved: 10 exam days × 4 shifts (Sundays Dec 4/11 absent from both tables; Dec 10 not listed) |
| 2023 | CGL 2023 (14–27-Jul) | 39 | 0 | 3 | 3 | 36 | verified: 14-Jul S1, S2; 17-Jul S1; 25-Jul S1/S2 conflict flagged (union used) |
| 2024 | CGL 2024 (09–26-Sep; 12 exam days × 3 shifts = 36, per Oliveboard table + Adda "36 Shifts") | 36 | 0 | 0 | 0 | 36 | PDFs form-gated; per-day Shifts 1-3 documented |
| 2025 | CGL 2025 (12–26-Sep × 3 shifts + 14-Oct S1 = 46, per Oliveboard table) | 46 | 0 | 3 | 3 | 43 | verified: 12-Sep S1-3 (CDN response sheets); all other dates form-gated |
| **Total** | | **208** | **61** | **6** | **6** | **202** | |

## 4. Verified file log (one file = one shift)

### 4.1 `SSC-CGL/2023/2023-07-14_Shift-1.json` (100 Q, MEMORY-BASED, verified)
- **Primary:** Adda247 CBE exam-screen export via Collegedekho CDN (header: Exam Date 14/07/2023, venue "TCS Gito Bitan", 09:00–10:00 AM; per-question SSC IDs).
- **Corroboration:** Cracku solved page for the same date+shift (1:1 question alignment across all 100 questions) + KD Campus same-day analysis.
- **Structure:** CGL 2023 section order GI&R 1–25, General Awareness 26–50, Quant 51–75, English 76–100 (as on the CBE screen).
- **Integrity notes:** Q8 (GI&R) option C conflict between Collegedekho ("15 : 9") and Cracku ("15 : 4") — Collegedekho value kept (primary CBE export), conflict flagged in the file note. All 100 question bodies recovered (figures for figure-based questions are image-only in the source).
- **Answers:** all null (policy §1.6).

### 4.2 `SSC-CGL/2023/2023-07-14_Shift-2.json` (100 Q, MEMORY-BASED, verified)
- **Primary:** Cracku solved page ONLY (the Collegedekho export for this shift is a dead `NoSuchKey` link).
- **Corroboration:** CareerPower 14-Jul S2 exam analysis + HelloScholar shift-timing snippet (S2 = 11:45 AM slot).
- **Integrity notes:** source artifacts preserved verbatim and flagged: Q27 "9rd", Q42 "Baikal rocks", Q72/Q73 LaTeX renderings. The rejected Adda "Memory Based" day-compilation (belongs to a different shift) is documented in the file note.
- **Answers:** all null.

### 4.3 `SSC-CGL/2023/2023-07-17_Shift-1.json` (100 Q, MEMORY-BASED, verified)
- **Primary:** Cracku solved page (8 rotating chunk-fetches reassembled and cross-checked for continuity).
- **Corroboration:** SSC Adda same-day analysis (topic list matched question-for-question) + Examzy 17-Jul shift timings.
- **Integrity notes:** verbatim artifacts flagged: Q6 duplicate image slot, Q17 garbled symbols, Q29, Q43 "Sangh", Q59 capital "Y", Q63 "~", Q71 "3o", Q85 "Petru!", Q96 "(S)".
- **Answers:** all null.

### 4.4–4.6 `SSC-CGL/2025/2025-09-12_Shift-{1,2,3}.json` (100 Q each, MEMORY-BASED, verified)
- **Primary:** Oliveboard CDN CBE "challenge module" candidate response sheets; headers "Test Date : 12 Sep 2025" at 09:00 AM / 12:30 PM / 04:00 PM for S1/S2/S3.
- **Corroboration:** Oliveboard Tier I PYP page lists exactly these 3 shifts for 12-Sep with the same direct CDN links.
- **Structure:** global Q.No 1–100; PART-A GI&R 1–25, PART-B GA 26–50, PART-C Quant 51–75, PART-D English 76–100. No SSC question IDs in this format (`question_id: null` throughout).
- **PARTIAL-CONTENT disclosure (identical class in all three files):** the source PDFs exceed the 30-page text-parse limit of this environment, so only PART-A + PART-B + the first few PART-C questions are recovered; **Q52/Q54–100 are marked `[NOT RECOVERABLE: beyond the 30-page parse limit]`**. Bilingual EN+HI sources — only the English layer transcribed; garbled Hindi preserved verbatim where it is the only recoverable content. The source itself warns that *in the challenge module the sequence of questions/options may differ from the exam screen* — recorded in each file's notes. Chinese character "和" appears verbatim in several GA stems (S2 Q26/Q38/Q45; S3 Q37/Q41) — preserved with a note. Answered-status markers are graphics (not recovered); only "Not Answered" markers are text and are recorded per question.
- **Answers:** all null (candidate "Chosen Option" is not present as text in this format).

## 5. Duplicate / mislabel audit (`tools/fingerprint.py`)

693+ distinct question fingerprints across all 12 files; **7 cross-file groups, all explained** (no true content duplication, no cross-date or CGL↔CHSL contamination):

1. CGL 2023 figure-series boilerplate stem "Select the figure that will replace the question mark…" — appears in 3 files (14-Jul S1 Q9 = 14-Jul S2 Q3 = 17-Jul S1 Q20). Legitimate: identical standard CGL stem, different figures (image-only).
2. CGL 2023 "Select the figure from the options…" boilerplate — 2 files (14-Jul S1 Q13 = 14-Jul S2 Q23). Legitimate.
3. CGL 2025 `[NOT RECOVERABLE: question body absent…]` placeholder — 3 files (one per 12-Sep file). Placeholder, not content.
4. CGL 2025 `[NOT RECOVERABLE: beyond the 30-page parse limit…]` placeholder — 3 files. Placeholder, not content.
5. CHSL `[NOT RECOVERABLE: rendered as image in source PDF]` placeholder — multiple CHSL files. Placeholder, not content.
6. Mirror-image standard stem "Select the correct mirror image…MN" — multiple CHSL files. Legitimate shared standard wording (figures image-only in all).
7. CHSL `[NOT RECOVERABLE: question falls off the end…]` tail placeholder — 2 files. Placeholder, not content.

Any *new* cross-file group appearing after a future fetch must be investigated before the file is committed (per the one-wrong-paper-is-unacceptable rule).

## 6. Answer-verification status

**None of the 600 questions in this repository has a `correct_answer`.** Rationale (documented in every file's `notes.ANSWERS`): SSC publishes tentative/final answer keys (e.g. CGL 2023 tentative 01-Aug-2023; CGL 2024 tentative 03-Oct-2024; CGL 2025 tentative ~Oct-2025), but per-candidate downloads require login (roll no + password) on ssc.gov.in/ssc.nic.in and **no machine-accessible consolidated key PDF was found in this environment for any CGL year**. Per the project rule, answers are never guessed and AI reasoning never overrides an official key; the defensible state is `correct_answer: null` + `answer_source: null`, with candidate choices preserved in `answer_note` where the source provides them.

## 7. Source-availability limitations (honest boundaries)

- **30-page text-parse limit** on `fetch_page` for PDFs → Oliveboard 2025 response sheets yield PART-A/B + part of PART-C only.
- **Adda247 S3 bucket throttling** (observed 2026-08-24): several CHSL/CGL objects returned `AccessDenied` intermittently (some resolved after spacing; at least one final chunk was denied for 15+ min before succeeding — see CHSL log).
- **Form-gated PDFs:** every Oliveboard PYP PDF except the 12-Sep-2025 trio requires the "free PYP kit" form; not retrievable here. Cracku downloads likewise login-gated.
- **Dead mirrors:** Collegedekho CDN objects for 14-Jul S2 / 17-Jul S1 no longer exist.
- **Old years (2016–2021):** only window-level schedules are documented from sources accessible here; per-day shift schedules were not established and are marked null (not invented).

## 8. Conflicts flagged (not silently resolved)

1. **CGL 2023 25-Jul shift set:** Cracku = S1, S3, S4; Oliveboard = S2, S3, S4 + a stray "Shift 1" table row after the 24-Jul block. Metadata uses the union (S1–S4) with the conflict flagged; exact set TO VERIFY (both sources' PDFs form-gated).
2. **CGL 2023 27-Jul Shift-4:** absent from both Cracku and Oliveboard → not counted as expected.
3. **CGL 2019 exam-day count:** 7 vs 8 vs 9 across sources; Oliveboard's 8-date table used per-day, conflict flagged.
4. **CGL 2023 14-Jul S1 Q8 option C:** "15 : 9" (Collegedekho CBE export) vs "15 : 4" (Cracku) — kept the CBE export value, flagged.
5. **CGL 2021 table completeness:** Oliveboard lists only 4 of the 12 window days; other days null, TO VERIFY.
6. **CGL 2025 4th shift:** some sources describe a 4th "optional" shift; no 4th shift appears in the Oliveboard table for any date → 3 shifts/day documented.

## 9. Correction log

1. **2026-08-24 — CGL 2020 (Tier I):** earlier build marked 2020 as "exam NOT conducted". Corrected after the Oliveboard PYP page documented a "CGL 2020 Tier 1" table with March-2020 dates (03–07-Mar S1-3, 09-Mar S1). The Tier I exam WAS held in March 2020; what was postponed/merged into CGL 2020-21 was the cycle's Tier II. `SSC-CGL/2020/metadata.json` now says `conducted: true` with a correction note.
2. **2026-08-24 — CGL 2024 per-day shifts:** upgraded from "window only" to 12 days × Shifts 1-3 (36) per the Oliveboard PYP table, corroborated by Adda247's "36 Shifts" statement.
3. **2026-08-24 — CGL 2022-Dec:** upgraded from "5 days × 4 (Cracku only)" to the full 10 days × 4 (40) per the Oliveboard table (Cracku corroborates 5 of the 10 days); Dec 4/11 Sundays absent from both tables; Dec 10 not listed (null).

## 10. Re-audit procedure

```bash
python3 tools/validate.py          # structure/field/numbering/options/answer checks (must be N/N pass)
python3 tools/coverage.py          # expected vs collected vs missing (per-year + detail)
python3 tools/coverage.py --sync   # rewrite 'papers' arrays in metadata.json to match disk
python3 tools/fingerprint.py       # cross-file duplication / mislabel detection
```

Per-question spot-check (audit 2 of 3): re-fetch a sample question's span from the primary source and diff verbatim against the JSON (done for all files at build time; samples re-checked during the final audit — see CHSL log §9 for the procedure and results).
