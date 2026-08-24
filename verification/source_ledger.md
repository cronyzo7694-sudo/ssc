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
