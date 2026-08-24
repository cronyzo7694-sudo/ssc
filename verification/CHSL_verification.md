# SSC CHSL Tier I — Verification Log (calendar years 2016–2025)

Repository: `cronyzo7694-sudo/ssc` · branch `arena/01a032e9-ssc` · date of this log: **2026-08-24**

## 0. Overall status (read first)

**This repository is NOT complete CHSL coverage.** Verified question-paper files exist for **6 of 76 documented expected shifts** (all from the CHSL 2023-24 exam of Aug 2023). All other shifts are documented as MISSING with per-day checklists in `metadata.json`; older years carry window-level schedules with per-day shift counts marked `expected_shifts: null` (NOT invented). No content was invented, completed or paraphrased; unrecoverable spans carry `[NOT RECOVERABLE: <reason>]`.

## 1. Verification standard

Identical to the CGL log (§1): date+shift proven from the source document header, ≥1 corroborating source, continuous 1–100 numbering, verbatim preservation with explicit NOT-RECOVERABLE markers, fingerprint-clean, and **no answers set** (SSC keys are login-gated; candidate "Chosen Option" and Adda's embedded ✓/X key-marks are reference-only and never used for `correct_answer`).

CHSL-specific conventions (uniform across all 6 files):
- **Section order on the CBE screen (CHSL 2023 Tier I):** 1) English Language Q.1–25, 2) General Intelligence Q.1–25, 3) Quantitative Aptitude Q.1–25, 4) General Awareness Q.1–25. Files use **global numbering 1–100** in that order (English=1–25, Reasoning=26–50, Quant=51–75, GA=76–100) and record the original **per-section SSC `question_id`** (264330xxxxxx) for every question where the parse provides one.
- **Leaked-fragment attribution convention:** text-layer fragments appearing directly after a question's own Question-ID + Status block are attributed to that question as *probable* (the following question always carries its own complete ID + Status block); flagged per-question. Fragments that are option-sets without a stem, or that sit in a multi-fragment gap, go to the file `notes` as UNATTRIBUTED (never attached).
- **KEY-MARK ARTIFACTS:** Adda247's tables embed check-mark/'X' marks next to options (their answer-key notation). Recorded in `answer_note`/notes only, explicitly UNVERIFIED against the SSC official key, never used.

## 2. Source investigation log

### Used
| Source | What it provided | Access |
|---|---|---|
| Adda247 CHSL PYQ page (`adda247.com/jobs/ssc-chsl-previous-year-question-paper/`) | Per-shift direct CBE export PDFs: the **full Aug-2023 map** (10 exam days × 4 shifts, object ids `09181126`–`09181238` under `.../uploads/sites/22/2025/07/`) and the Jul-2024 map (9 days × 4 PDFs with time windows in filenames) | direct PDFs (S3 throttling observed — §7) |
| Adda247 CBE exports (per-shift PDFs listed above) | Primary for all 6 verified CHSL files (Exam Date header + SSC IDs + one candidate's Status/Chosen Option) | direct PDF |
| Testbook CHSL 2023 PYP listing | Corroboration (e.g. 02-Aug S1 "Official Paper" 100Q/200M; 03-Aug shifts listed) | HTML (PDFs login-gated) |
| result91.com / Shiksha per-day articles | CHSL 2022-23 (Mar 2023) day list (09/10/13/16-Mar — completeness NOT verified) and the conflicting "August 5" TOC entry for Aug 2023 | HTML |
| sscdrishti.com vault (`vault.sscdrishti.com/english_file_uploads/…`) | Genuine CBE exports for 07-Aug & 08-Aug 2023 (multiple shifts) — additional cross-check availability | direct PDF (English-section focused) |
| Byjus / JagranJosh | CHSL 2017-18 window (conflicting: 04–26-Mar vs 20-Mar–20-Apr 2018) | HTML |

### Rejected
- **Adda247 "Similar Paper" PDFs (CHSL 2025, `.../SSC-CHSL-T-I-Similar-Paper-Held-on-<date>-S<n>-English.pdf`)** — RECONSTRUCTED documents (coaching rebuilds), not CBE exports; **not usable as verified data**. Used only to document the 12-Nov vs 13-Nov start-date conflict (§8).
- PrepIn cycle labels (mislabeled — never trust).

### Blocked / inaccessible
- SSC answer-key portal (login-gated per candidate) — no machine-accessible key for any CHSL year.
- Adda247 S3 throttling on several objects (§7).

## 3. Year-by-year checklist (expected vs collected)

`python3 tools/coverage.py SSC-CHSL`, 2026-08-24. `(+Nd)` = exam days in a documented window with per-day shift schedule NOT established.

| Year | Exam (cycle) | Expected (documented) | Undocumented days | Collected | Verified | Missing | Notes |
|---|---|---|---|---|---|---|---|
| 2016 | CHSL 2015-16 (Feb 2016) | 0 | 29 | 0 | 0 | — | month-level evidence only |
| 2017 | CHSL 2016-17 (07-Jan–08-Feb) | 0 | 33 | 0 | 0 | — | window-level only |
| 2018 | CHSL 2017-18 | 0 | 48 | 0 | 0 | — | **window conflict flagged** (Byjus 04–26-Mar vs JagranJosh 20-Mar–20-Apr) |
| 2019 | CHSL 2018-19 (01–26-Jul; 9 days × 3) | 0 | 26 | 0 | 0 | — | 9 exam days × 3 per sources; per-day allocation not established |
| 2020 | CHSL 2019-20 (17–19-Mar partial + 12–26-Oct; 9 days × 3) | 0 | 18 | 0 | 0 | — | two-part window; per-day allocation not established |
| 2021 | CHSL 2020-21 (12–19-Apr excl. WB + 04–12-Aug) | 0 | 17 | 0 | 0 | — | window-level only |
| 2022 | CHSL 2021-22 (24-May–10-Jun; result 04-Aug) | 0 | 18 | 0 | 0 | — | window-level only |
| 2023 | TWO exams: CHSL 2022-23 (Mar 2023) + CHSL 2023-24 (Aug 2023) | 40 (Aug) | 4 (Mar) | 6 | 6 | 34 | Aug: 10 days × 4 per Adda's 4-PDFs-per-date map; Mar day list 09/10/13/16-Mar (completeness TO VERIFY); Shiksha "05-Aug" conflict flagged |
| 2024 | CHSL 2023-24 (10+2) (01–11-Jul; 9 exam days × 4 shifts = 36) | 36 | 0 | 0 | 0 | 36 | 4 shifts/day per Adda's 4 direct PDFs per date with time windows (9:00/11:45/14:30/17:15); prepp.in/sscadda list 3 — conflict flagged (§9) |
| 2025 | CHSL 2024-25 (10+2) (12–30-Nov per official schedule) | 0 | 19 | 0 | 0 | — | per-day shift counts not established; **start-date conflict flagged** (Adda list starts 13-Nov S2) |
| **Total** | | **76** | **192** | **6** | **6** | **70** | |

## 4. The Aug-2023 per-shift PDF map (basis of the 40-shift expectation)

Adda247 CHSL PYQ page hosts 4 distinct CBE exam-screen export PDFs per date (Shift I–IV), base `https://www.adda247.com/jobs/wp-content/uploads/sites/22/2025/07/<object>/SSC-CHSL-2023-DD-MM-2023-Shift-R-Paper.pdf`:

| Date | S1 | S2 | S3 | S4 | Status in this repo |
|---|---|---|---|---|---|
| 02-Aug | `09181126` | `09181127` | `09181129` | `09181130` | **all 4 verified** |
| 03-Aug | `09181132` | `09181134` | `09181136` | `09181137` | **S1, S4 verified** (S2/S3 object AccessDenied during this session — throttled, §7) |
| 04-Aug | `09181138` | `09181141` | `09181143` | `09181145` | missing (S1 object throttled at session end) |
| 07-Aug | `09181147` | `09181149` | `09181151` | `09181153` | missing |
| 08-Aug | `09181155` | `09181157` | `09181159` | `09181201` | missing |
| 09-Aug | `09181203` | `09181205` | `09181207` | `09181209` | missing |
| 10-Aug | `09181210` | `09181212` | `09181214` | `09181216` | missing |
| 11-Aug | `09181217` | `09181218` | `09181220` | `09181221` | missing |
| 14-Aug | `09181224` | `09181226` | `09181228` | `09181230` | missing |
| 17-Aug | `09181232` | `09181234` | `09181236` | `09181238` | missing |

The existence of four distinct per-shift objects per date is direct evidence that 4 shifts were held each date (each PDF carries the Exam Date header and a distinct SSC-ID set).

## 5. Verified file log (one file = one shift)

### 5.1 `SSC-CHSL/2023/2023-08-02_Shift-1.json` (100 Q, MEMORY-BASED, verified)
- **Primary:** Adda247 CBE export (header Exam Date 02/08/2023; IDs 264330xxxxxx + candidate Status/Chosen Option). **Corroboration:** same-date S2/S3/S4 exports (distinct ID sets) + Testbook listing ("Official Paper" 100Q/200M/60min).
- **PARTIAL-CONTENT:** English Q1–25 recovered (Q8 options image-only; Q20 option A only; Q22–24 cloze partial); Reasoning Q35–37 full + Q38/Q50 partial; Quant Q51–52, Q61–64 full (Q63 contains the "树" glyph verbatim — preserved); GA Q90–93 full + Q85 options; GA Q98–100 unrecoverable (no IDs in parse). Unattributed fragments documented (2x+2/x=5 block, sin²A+sin⁴A, cosθ=9/17, mixed fractions 6⅔…, Disciplines×Colleges DI, Onions/Sugar/Rice/Wheat bar, 12034 cm³, secθ, GA angle set 70°/60°/790-sic/40°).

### 5.2 `SSC-CHSL/2023/2023-08-02_Shift-2.json` (100 Q, MEMORY-BASED, verified)
- **Primary:** Adda247 CBE export (IDs 26433014xxxx — distinct from S1's set, proving a different shift). **Corroboration:** same-date sibling files + Testbook.
- **PARTIAL-CONTENT:** English Q1–25 stems full (options partial; Q12–15/Q18/Q19 carry embedded ✓ key-marks — incl. Q13 contradiction ✓=Hearse(2) vs Chosen 1, recorded in note); Reasoning mostly image-only (Q33 numeric series full + X/unmarked key artifact; Q49 mirror stem; Q50 rectangles stem; Q32 symbol grids leaked); Quant Q55 DI "Stations 2100 700 800 1200 900" + √ options, Q59 (a³−b³)=4401 fragment, **Q60 full** (working/sleeping partner problem; question_id null — ID absent from parse), Q61–62 entirely absent (null IDs), Q65 options, Q68 trig, Q71 DI + angles; GA Q78 stem; GA 92–100 unrecoverable. Unattributed: Class V–VIII DI table, x+1/x=5√2 question + 22970√23/23060√23, angle set 60°/70°/80°, 2×2 fragment.

### 5.3 `SSC-CHSL/2023/2023-08-02_Shift-3.json` (100 Q, MEMORY-BASED, verified)
- **Primary/Corroboration:** as S1/S2 (third distinct ID set).
- **PARTIAL-CONTENT:** **English Q1–25 FULL** (Q1 "Daddy baked the cookies…", Q2 antonym severe, Q3 error "the thieves have leave" — option 4 is the stem segment, flagged; Q4 Bhagat Singh; Q5 one-word stress; Q6 jumbled reading; Q14 Madurai SPQR/SOPQ; Q16–20; cloze "Friendship" Q21–25 — Q21 full, Q22–25 options 3–4 only); Reasoning Q30 code MOST=3472/STOW=2634 (✓4), Q31 odd pair 17:82/31:158/19:92/47:232 (✓1, Chosen 1), Q32 "@ $ @ $ @ $ ?" (✓1), Q28/Q29 stems; Quant Q59 family-spend-1999 DI, Q62 secθ−tanθ=m fragment, Q66 tanθ=8/19→sec²θ (X artifact), Q70 a=1/(a−√6)→(a+1/a), **Q74 FULL** (Amitaitha 30% discount), **Q75 FULL** (S sells ₹37,800 +8% / P −4%); GA Q76 RK Bijapure, Q77 speculative demand; GA 94–100 unrecoverable. Unattributed: area options 20√15/22√11; "If x=5 (x>0) find x+1/x" (√41/√29/√23/√43).

### 5.4 `SSC-CHSL/2023/2023-08-02_Shift-4.json` (100 Q, MEMORY-BASED, verified — see correction log §9.2)
- **Primary:** Adda247 CBE export (header Exam Date 02/08/2023). **Corroboration:** same-date siblings + Testbook.
- **PARTIAL-CONTENT (post-correction, 2026-08-24):** English Q1–25 recovered (Q3 ID missing at page boundary; Q14 "fail: …" sic options preserved); Reasoning almost entirely image-only (Q29 ELI/ZGD/NXR, Q28 stem, Q38 symbol fragments); Quant image-only except Q55 (x²−1)/(x−1) expression, Q58 geometry (∠ACD=127°…→∠BAC, key marks), Q62 trig expression, Q65 17³−7³ expression + options, Q66 bar-graph (50/60/80/30, X/✓ artifacts), Q67 pie-chart (₹1,50,00,000, all-✓ artifact), Q71 garbled option set, **Q75 leaked angle option set 65°/40°/75°/55° (probable, attached per convention)**; GA image-only except Q88–Q91 full (free-enterprise, microfinance, Sher Shah's Tomb, Maharashtra association); **GA Q.17–Q.24 (global 92–99): SSC IDs + candidate statuses recovered** when the previously-denied final chunk became retrievable (2026-08-24); **GA Q.25 (global 100) does not exist in the PDF's text layer** (document ends at GA Q.24) — marked NOT RECOVERABLE with that exact reason.

### 5.5 `SSC-CHSL/2023/2023-08-03_Shift-1.json` (100 Q, MEMORY-BASED, verified)
- **Primary:** Adda247 CBE export (Exam Date 03/08/2023; **all 100 SSC question IDs present**). **Corroboration:** same-date S4 export + Testbook.
- **PARTIAL-CONTENT:** English Q1–25 (Q1 instruction line missing + word "Sumptuous"; Q2 duplicate "expected" options verbatim; Q5 stem missing; Q9 "Medical termnalogy" sic instruction missing; Q18 duplicate-rendering conflict: main row Answered Chosen 2 vs stray "Not Answered" line — noted); Reasoning Q30 129:32:109:27:289:7 (✓3), Q42 8,11,22,?,50,53 (√4), Q43 syllogism with **Chinese 和/是 verbatim in options 2–4** (preserved + noted), Q44 VAPORIZE, Q46 odd pair 5:23/4:19/2:11/7:32; Quant Q56 √(a/b)=a/3+√(b/a), Q57 DI table (Years/Basketball/Football/Cricket, Boys-Girls 2018–2022), Q60 cosθ/(1+sinθ)+cosθ/(1−sinθ)=4 (60°✓/45°(450-sic)/30°), Q63 α=2/√3, Q67 (140°, 120°), Q71 2x+3y=9 + area options, Q74 Medicine Company DI; GA all 25 image-only but every ID + candidate status recorded. Unattributed: BODMAS expression, trig "0°+cos30°−tan45°+cos80°+cot90°" (sics), 7/(6√3)/√3/6/7/6/7/(2√3) set, "90 cm²", angles 80°/60°/100°/20°.

### 5.6 `SSC-CHSL/2023/2023-08-03_Shift-4.json` (100 Q, MEMORY-BASED, verified — built 2026-08-24)
- **Primary:** Adda247 CBE export (header Exam Date 03/08/2023; all 4 chunks fetched with verified-continuous chunk boundaries). **Corroboration:** same-date S1 export (distinct ID sets) + Testbook.
- **Content coverage:** English Q.1–Q.20 recovered with stems + most options (Q.1 opts 3-4, Q.2/Q.3 opts 1-2/3-4, Q.20 opts 1-2 image-only; Q.15 ID missing at page boundary; Q.10 options 1&2 identical "Occasion" sic; Q.17 "Hieararchy" sic); cloze (Grim Reaper/Black Death) passage full, SubQ21–25 options 3-4 only; **GI all 25 blocks present** (text: Q.10 paper-folding, Q.11 triangle count, Q.21 mirror image, Q.22 coding "WF 18…ZI 13…NT 16…QW 11…SL 19", Q.25 figure series; option numbers run together in Q.10/Q.11 — "1.234"/"1.2021224" sic); **Quant Q.1–Q.17 + Q.21–Q.25 present** (Q.1 leaked angle options with X/✓/X key marks; Q.9 leaked fraction set incl. garbled "x1,104,"; Q.24 "cot²tt" + 49/484, 357/484, 7/22, 225/484; Q.25 full cot A±cos A identity question; **Q.18–Q.20 (global 68–70) blocks ABSENT from the parsed text layer** — marked with that exact reason); **GA Q.1–Q.19 present** (Q.1–Q.3 options 2-4 only; Q.4 Jaimal & Patta/fort; Q.5 ITCZ; Q.6 FIDE 2022 "Koneru Hampi" sic; Q.7 music director; **GA Q.20–Q.25 (global 95–100) ABSENT — document ends at GA Q.19**). Unattributed fragments: trains DI table + a³+b³+c³−3abc all-marked option set (Q.13/Q.14 gap); algebra fragment "1ffff³=270+y³"… + √3/4√3/4√2 + linear-equations fragment "11aa+3b=14, 2a−3b=10" (Q.24/Q.25 gap); trig option "(up-up-)up==√3/2" + states DI table (Assam/Bihar/Kerala/UP 2019–2022) spanning the absent Q.18–Q.20 pages.

## 6. Duplicate / mislabel audit

Same tool and standard as the CGL log. CHSL cross-file groups observed (all explained): the image-placeholder group, the mirror-image standard-stem group (S1, S2, S4-02Aug, S4-03Aug), the tail-NOT-RECOVERABLE placeholder group (S2-02Aug, S4-02Aug), plus the CGL-side groups enumerated in the CGL log §5. **No cross-date mislabeling and no CGL↔CHSL contamination.** All Aug-2023 files carry mutually disjoint SSC-ID sets, which independently confirms they are distinct shifts (the core mislabel risk for this exam series).

## 7. Source-availability limitations

- **Adda247 S3 throttling (2026-08-24):** per-object intermittent `AccessDenied`. During this session: 02-Aug S4 final chunk denied 6+ times over 15+ min, then succeeded (drove correction §9.2); 03-Aug S2 (`09181134`) and S3 (`09181136`) denied on every retry; 04-Aug S1 (`09181138`) denied; 03-Aug S4 (`09181137`) succeeded after earlier denials. Files affected by still-denied objects remain MISSING (not guessed).
- **30-page text-parse limit** (irrelevant for the short CHSL exports, relevant for Oliveboard response sheets — see CGL log).
- **Login-gated:** Testbook/PrepIn/SSC answer-key downloads.

## 8. Conflicts flagged (not silently resolved)

1. **CHSL 2023 Aug day list:** Adda247's 4-PDFs-per-date map gives {02,03,04,07,08,09,10,11,14,17-Aug}; Shiksha's TOC lists "CHSL (August 5)" and omits 02/03/04. **Resolution used:** Adda (direct per-shift PDFs = stronger evidence), conflict flagged in `SSC-CHSL/2023/metadata.json`.
2. **CHSL 2023 Mar (2022-23 cycle) day list:** result91/Shiksha document 09/10/13/16-Mar only — completeness NOT verified; listed as `null` days, flagged.
3. **CHSL 2024 shifts/day:** Adda hosts 4 direct PDFs per date (time windows 9:00/11:45/14:30/17:15) → 4 shifts/day (36 total); prepp.in/sscadda list 3 for most dates. **Resolution used:** Adda (direct per-shift PDFs), conflict flagged in the 2024 metadata notes.
4. **CHSL 2025 start date:** official schedule window starts 12-Nov-2025; Adda's "Similar Paper" list starts 13-Nov S2 (no 12-Nov S1 entry). 12-Nov S1 existence TO VERIFY; no CHSL 2025 file exists (the Adda PDFs are RECONSTRUCTED and were not used).
5. **CHSL 2017-18 window:** Byjus 04–26-Mar-2018 vs JagranJosh 20-Mar–20-Apr-2018 — union window listed, conflict flagged, unresolved.

## 9. Correction log

1. **2026-08-24 — CHSL 2024 per-day shifts:** earlier metadata assumed 3 shifts/day (28 expected). Upgraded to 4 shifts/day × 9 days = **36** on the strength of Adda247's 4 direct CBE PDFs per date (time windows in filenames); prepp.in/sscadda's 3-shift listings recorded as the conflicting weaker source.
2. **2026-08-24 — `2023-08-02_Shift-4.json` (misattributed IDs corrected):** in the initial build the final PDF chunk was consistently AccessDenied, and two Question-ID lines (`264330144478`, `264330146002`) found earlier in the parse were provisionally positioned at globals 92/93. On 2026-08-24 the final chunk became retrievable; a continuous re-fetch (chunk 3 ends with GA Q.16 block `264330148591`; chunk 4 begins with the GA Q.17 block) established GA Q.17–Q.24 = `264330145716 / 264330150353 / 264330150428 / 264330150049 / 264330154804 / 264330145880 / 264330151328 / 264330149940` (globals 92–99, image-only bodies) with candidate statuses. The two previously positioned IDs appear nowhere in the fully re-fetched text layer (all 5 chunks re-verified) and were treated as parse artifacts, attributed to no question. Global 100 (GA Q.25) does not exist in the PDF's text layer — the document ends at GA Q.24 — and carries that exact reason. All other 98 IDs in the file were re-verified against the same re-fetch and match. The full correction is recorded in the file's `notes`.

## 10. Re-audit procedure

Same as the CGL log (§10): `validate.py`, `coverage.py [--sync]`, `fingerprint.py`, plus per-question verbatim spot-checks against the primary source (procedure: pick N random questions, re-fetch the source chunk containing them, diff verbatim; performed at build time for every file and re-sampled in the final audit).
