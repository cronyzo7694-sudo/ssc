# Recovery source ledger

Updated: 2026-08-24  
Scope: maximum-coverage recovery for SSC CGL and SSC CHSL Tier-I, calendar years 2016–2025.

`source_type` is deliberately separate from official SSC provenance. A coaching/archive site is not treated as official merely because it hosts an SSC-labelled paper.

| Source | Exam/years | Available dates/shifts observed | Format | Reliability / use | Problems |
|---|---|---|---|---|---|
| <https://sscportal.in/papers> | CGL/CHSL, older and recent | Links to CGL 2016–2020/2022–2024 and CHSL 2016–2021/2023–2024 sections | Archive index | Candidate discovery only | Direct origin PDFs failed TLS in this environment; many older entries are subject-wise HTML/image pages. |
| <https://sscportal.in/cgl/tier-1/papers/2024> | CGL 2024 | 09–13, 17–19, 23–26 Sep; Shift 1–3 | Direct PDF landing pages | Candidate discovery; not used as verified content | Binary not directly retrievable; each PDF requires page/image validation. |
| <https://sscportal.in/chsl/tier-1/papers/2024> | CHSL 2024 | 01–05, 08–11 Jul; Shift 1–4 | Direct PDF landing pages | Candidate discovery; not used as verified content | Same binary retrieval/validation limitation. |
| <https://sscportal.in/cgl/tier-1/papers/2023> | CGL 2023 | Multiple July dates and shifts | Direct PDF landing pages | Duplicate check against existing files | Existing 14-Jul S1/S2 and 17-Jul S1 overlap current repository. |
| <https://sscportal.in/chsl/tier-1/papers/2023> | CHSL 2023 | Multiple August dates and shifts | Direct PDF landing pages | Duplicate check against existing files | Existing six Aug-2023 files overlap current repository. |
| <https://www.careerpower.in/blog/ssc-chsl-4th-july-exam-analysis-2024> | CHSL 2024 | 04-Jul Shift-1 | HTML memory-based analysis | **Used for partial recovery**; one source, explicitly memory-based | 14 Quant stems and 3 exact General Awareness stems; no options/answers; not a complete paper. |
| <https://www.practicemock.com/blog/ssc-cgl-exam-analysis-2024-10th-sept-2nd-shift/> | CGL 2024 | 10-Sep Shift-2 | HTML analysis | Corroboration/discovery only | Topic counts, not a complete question sequence. |
| <https://www.studyiq.com/articles/ssc-cgl-exam-analysis-10th-september-2024-all-shifts/> | CGL 2024 | 10-Sep Shift-2 | HTML analysis | Corroboration/discovery only | Selected recalled questions/topics, not complete paper. |
| <https://www.sscadda.com/ssc-cgl-tier-1-exam-analysis-10th-september-2024-shift-2/> | CGL 2024 | 10-Sep Shift-2 | HTML analysis | Corroboration/discovery only | Memory-based topic list, not complete paper. |
| <https://prepp.in/ssc-cgl-exam/practice-papers> | CGL 2016–2025 | Shift-wise index | PDF/answer-key links | Candidate discovery | Downloads may be gated; provenance and completeness require per-file validation. |
| <https://prepp.in/ssc-chsl-exam/practice-papers> | CHSL 2016–2024 | Shift-wise index | PDF/answer-key links | Candidate discovery | Same validation requirement; memory-based/official labels must be checked. |
| <https://www.adda247.com/jobs/ssc-cgl-previous-year-question-paper/> | CGL 2019–2025 | Shift-wise index | PDF links | Candidate discovery | Some links/objects are gated or unavailable; not blindly copied. |
| <https://www.adda247.com/jobs/ssc-chsl-previous-year-question-paper/> | CHSL 2019–2025 | Shift-wise index | PDF links | Candidate discovery | Availability and exact shift attribution require validation. |
| <https://www.oliveboard.in/blog/ssc-cgl-tier-1-pyps/> | CGL 2019–2025 | Shift-wise index | PDF links/tables | Schedule corroboration | Form-gated PDFs except already-used 12-Sep-2025 files. |
| <https://www.shiksha.com/sarkari-exams/ssc/articles/ssc-chsl-2023-question-paper-with-answer-key-pdf-all-days-shifts-blogId-130887> | CHSL 2023 | August 2023 day list | Memory-based HTML/PDF index | Conflict comparison only | Day list conflicts with direct per-shift archive map. |
| <https://github.com/Urten/indian_govt_exam> | Unspecified SSC/general | No confidently attributable shift matrix | XLSX | Rejected for SSC recovery | Workbook contains generic questions and no reliable exam/date/shift provenance; not copied. |

## First direct-PDF gate

Candidate tested:
<https://sscportal.in/sites/default/files/ssc-cgl-tier-1-paper-2024-sep-10-shift-2.pdf>

The origin host could not be downloaded directly because the TLS connection closed. A text extraction proxy exposed a 40-page, mixed text/image document with CGL Tier-I header, 10/09/2024, 12:30–1:30 PM and four 25-question sections. Figure questions/options were not recoverable from the available representation. It was therefore rejected as a complete paper and not added as a verified JSON file.

## Status vocabulary

- `COMPLETE_VERIFIED`: complete paper, independently corroborated, validated.
- `COMPLETE_MEMORY_BASED`: complete memory-based paper with strong shift attribution; counted separately from official/verified.
- `PARTIAL_VERIFIED`: attributed partial recovery with reliable source evidence.
- `PARTIAL_MEMORY_BASED`: partial question recovery from a memory-based source.
- `UNVERIFIED`: candidate found but not sufficiently confirmed.
- `MISSING_AFTER_SOURCE_SEARCH`: no usable attributable material after searches.

Only complete validated files affect the existing complete-paper coverage totals. Partial files are preserved separately and are not counted as complete shifts.

## Bulk-source phase additions

| Source | Exam/years | Approximate bulk inventory | Format | Downloadable? | Complete/shift info | Access status | Decision |
|---|---|---:|---|---|---|---|---|
| <https://sscstudy.com/ssc-cgl-previous-year-question-paper-pdf-download/> | CGL 2016–2021 plus 2019–20 cycle | 6 CGL 2020 dates × 3 shifts explicitly linked; 2019-cycle and older collections advertised | Google Drive PDFs and all-shift collections | Links present; direct binary download failed TLS here | Date/shift labels are present for listed rows; actual PDF contents still require import validation | Landing page readable, Drive binaries inaccessible from sandbox | **Promising bulk candidate; not accepted yet** |
| <https://www.qmaths.in/2019/06/ssc-cgl-2018-tier-1-question-papers-pdf.html> | CGL 2018 cycle / held Jun 2019 | 21 date/shift links advertised | PDF links | Link inventory visible | Shift labels present; content not imported | Not tested as binary source in this pass | Candidate only |
| <https://www.careerpower.in/ssc-cgl-previous-year-question-paper.html> | CGL 2019–2025 | Shift-wise tables; 2024 table advertises 36 shifts | PDF links | Links advertised | Strong date/shift table; content validation pending | Landing page searchable | Candidate only |
| <https://www.class24.study/ssc-cgl/ssc-cgl-previous-year-question-paper> | CGL 2022–2024 | 40 CGL 2022 shift entries advertised plus 2023 collection | PDF links | Links advertised | Date/shift table present | Landing page searchable | Candidate only |
| <https://www.sscstudy.com/ssc-chsl-question-papers-pdf-download-hindi/> | CHSL 2019–2021 and older | Multi-date all-shift PDFs advertised | Google Drive PDFs | Links advertised; binary not imported | Often combines all shifts in one date package; boundary splitting required | Landing page readable | Promising candidate; not accepted yet |
| <https://byjus.com/ssc-exams/ssc-chsl-question-papers/> | CHSL 2020 | Multiple all-shift date packages advertised | PDF links | Links advertised | Dates and all-shift grouping visible | Landing page searchable | Candidate only |
| <https://result91.com/article/ssc-chsl-previous-year-question-paper> | CHSL 2021–2025 and 2022 cycle | Multi-year shift-wise tables advertised | PDF links | Links advertised | Date/shift labels present; cycle/year conflicts need resolution | Landing page searchable | Candidate only |
| <https://www.class24.study/ssc-chsl/ssc-chsl-previous-year-question-papers> | CHSL 2020–2024 | 2024 multi-shift table and 2023/2022 tables advertised | PDF links | Links advertised | Date/shift labels present | Landing page searchable | Candidate only |
| <https://github.com/Urten/indian_govt_exam> | General | 1 XLSX workbook | XLSX | Yes via git clone | No reliable SSC date/shift provenance; contents are generic | Successfully cloned | **Rejected** |

Bulk acceptance rule used: a source is not accepted merely because it advertises “all shifts”. At least 2–3 actual papers must be downloaded/read, boundaries and 100-question structure checked, and date/shift provenance corroborated before import. Direct binary access failed for the tested Google Drive/origin PDF paths in this environment, so no bulk source met the acceptance gate during this pass.
