# SSC Portal source audit

Audit date: 2026-08-24  
Primary index: <https://sscportal.in/papers>  
Source classification: `third_party_archive` (SSC Portal is not the official SSC website)

## Result

The portal was inspected through its CGL and CHSL index pages and linked year pages. It exposes many useful source candidates, but the index entries alone do not establish that a complete, machine-readable one-shift paper has been recovered. The portal mixes full-paper PDFs, subject-wise HTML pages, image-only questions and ebook links.

A first-paper direct-PDF gate was attempted before any batch processing. The exact origin PDF could not be fetched from this environment (the origin TLS connection closes during handshake). A text extraction proxy was used only to inspect the candidate, not as a substitute for provenance. It reported a 40-page PDF and exposed the CGL header, date and shift, plus four sections of 25 questions. However, figure-based question bodies/options are image-only in the extracted representation (for example Reasoning Q8, Q11, Q14, Q18, Q22 and several Quant items). The original binary could not be downloaded/rendered here to verify those images. Consequently the candidate is **INCOMPLETE / UNVALIDATED**, not a verified paper, and processing stopped at the first-paper gate.

Therefore **no new JSON paper was added in this pass**. Existing 12 verified JSON files were not modified.

## Index pages found

| Exam | Portal index | Year pages visible | Notes |
|---|---|---|---|
| CGL | <https://sscportal.in/cgl/papers> | 2016, 2017, 2018, 2019, 2020, 2022, 2023, 2024 | The portal labels cycle years inconsistently in places; filenames must use the actual held date and repository metadata year. No CGL 2021 or 2025 index page was linked from this index. |
| CHSL | <https://sscportal.in/chsl/papers> | 2016, 2017, 2018, 2019, 2020, 2021, 2023, 2024 | The portal labels some cycles by notification year rather than held year. No CHSL 2022 or 2025 year page was linked from this index. |

The root page links these sections at <https://sscportal.in/papers>.

## CGL findings

### CGL 2024

Index: <https://sscportal.in/cgl/tier-1/papers/2024>

The page lists 12 dates, each with Shifts 1–3: 09, 10, 11, 12, 13, 17, 18, 19, 23, 24, 25 and 26 September 2024. It therefore exposes 36 shift landing pages, including for example:

- <https://sscportal.in/ssc-cgl-tier-1-paper-2024-sep-10-shift-2>
- PDF linked by that page: <https://sscportal.in/sites/default/files/ssc-cgl-tier-1-paper-2024-sep-10-shift-2.pdf>

The landing page identifies CGL Tier-I, the held date and shift, and labels the link “Full Paper”. It does not itself prove question count or completeness. The PDF was not promoted to a repository JSON file because the binary could not be retrieved reliably in this environment for page-by-page validation.

### CGL 2023

Index: <https://sscportal.in/cgl/tier-1/papers/2023>

The portal lists shift landing pages for dates 14, 17, 18, 19, 21, 24, 25 and 26 July (four shifts where listed), and 27 July (three shifts). The portal entries overlap existing repository papers for:

- 14-Jul-2023 Shift-1
- 14-Jul-2023 Shift-2
- 17-Jul-2023 Shift-1

These are **DUPLICATE — DO NOT ADD**. Other index entries are candidates only until the linked material is recovered and checked; no new paper was added from an index label alone.

### CGL 2016–2020 and 2022

The year pages expose many subject-wise links rather than a single JSON/full-paper object. For example, the CGL 2016 page lists Reasoning, General Awareness, Quantitative Aptitude and English pages for each date/shift; a subject page contains 25 questions and image links. CGL 2018 similarly lists four subject pages for a held date/shift. Combining subject pages without validating all four sequences and their image content would violate the complete-paper requirement, so these remain missing in metadata.

Examples:

- 2016 index: <https://sscportal.in/cgl/tier-1/papers/2016>
- 2017 index: <https://sscportal.in/cgl/tier-1/papers/2017>
- 2018 index: <https://sscportal.in/cgl/tier-1/papers/2018>
- 2019 index: <https://sscportal.in/cgl/tier-1/papers/2019>
- 2020 index: <https://sscportal.in/cgl/tier-1/papers/2020>
- 2022 index: <https://sscportal.in/cgl/tier-1/papers/2022>
- Example subject page: <https://sscportal.in/cgl/tier-1/papers/04-june-2019-shift-1-general-awareness>

The portal's CGL 2019 page calls the held March 2020 papers “2019”; this is a cycle label and must not be silently used as a calendar date/year.

## CHSL findings

### CHSL 2023

Index: <https://sscportal.in/chsl/tier-1/papers/2023>

The page lists 02, 03, 04, 07, 08, 09, 10, 11, 14 and 17 August 2023, generally with four shift landing pages. Existing repository papers overlap these portal candidates for:

- 02-Aug-2023 Shifts 1–4
- 03-Aug-2023 Shifts 1 and 4

These six are **DUPLICATE — DO NOT ADD**. The other listed shifts were not added because a landing-page link is not sufficient proof that all 100 questions and options are recoverable.

### CHSL 2024

Index: <https://sscportal.in/chsl/tier-1/papers/2024>

The page lists 01–05 July and 08–11 July 2024, four shifts per listed day (36 index entries). The landing pages advertise paper links, but the complete PDFs were not recovered and validated in this environment. They remain missing rather than being represented by guessed or partial JSON.

### CHSL 2016–2021

The main CHSL index links year pages for 2016, 2017, 2018, 2019, 2020 and 2021. These pages expose candidate papers, but cycle-year/held-date labels and subject/page structure require per-paper validation. No new complete shift file was added.

Examples:

- <https://sscportal.in/chsl/papers/2016>
- <https://sscportal.in/chsl/papers/2017>
- <https://sscportal.in/chsl/papers/2018>
- <https://sscportal.in/chsl/papers/2019>
- <https://sscportal.in/chsl/papers/2020>
- <https://sscportal.in/chsl/tier-1/papers/2021>

## First-paper gate

Candidate: CGL 2024, 10-Sep-2024, Shift-2

Exact PDF: <https://sscportal.in/sites/default/files/ssc-cgl-tier-1-paper-2024-sep-10-shift-2.pdf>

```text
PDF fetched directly: NO (origin TLS connection closed)
PDF inspected through extraction proxy: YES (inspection only)
PDF readable: YES through extracted text; origin binary unavailable
PDF type: MIXED (text plus image-only figures/options)
Page count: 40 (proxy-reported)
Question count indicated: 100 (4 sections × 25)
Questions fully recovered: NO
Questions incomplete: YES — figure/image content is not available in the extracted text
Metadata verified from PDF: YES for CGL, Tier I, 10/09/2024, 12:30 PM–1:30 PM / Shift-2
Duplicate against existing repository: NO (date/shift absent from existing files)
JSON validation: NOT RUN — no JSON created because the candidate failed completeness
Gate result: STOP — INCOMPLETE / UNVALIDATED
```

The PDF extraction showed continuous section-local numbering 1–25 in the accessible text, but that is not enough to certify all question bodies and options because image-only figures were not recoverable. No OCR reconstruction was promoted to data.

## Integrity decision

- Portal pages found: yes.
- Full-paper candidates found: yes, especially CGL 2024 and CHSL 2024 landing pages.
- First-paper gate passed: **NO**.
- Batch processing started: **NO** (correctly stopped after the failed gate).
- New complete JSON papers added: **0**.
- New partial JSON recovery added: **1** — `SSC-CHSL/2024/2024-07-04_Shift-1_PARTIAL.json` containing 14 directly reported Quant stems and 3 exact GA stems from Career Power.
- Existing verified papers changed: **0**.
- Duplicate candidates skipped: **9** (three existing CGL candidates and six existing CHSL candidates, counted by overlap with portal index entries; no duplicate files added).
- Incomplete/unvalidated candidates: retained as `missing` in complete coverage metadata; the one safely attributable partial recovery is preserved separately and excluded from complete counts.
- Portal answer keys: not used to populate `correct_answer`; existing policy remains `null` unless a reliable answer source is independently verified.

`source` for any future recovered file from this archive must include the exact portal landing/PDF URL, and `source_type` must be `third_party_archive`. The root index alone must not be used as the only provenance for a paper.
