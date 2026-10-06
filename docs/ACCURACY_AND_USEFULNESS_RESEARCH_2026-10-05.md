# Planly: accuracy and practical usefulness

Researched October 5, 2026. Scope: repository source review, existing product briefs, current external research and product documentation. No application behavior was changed. This is a product recommendation, not a measured claim of Planly's drawing accuracy.

## Recommendation

Serve architects, consultants, and contractors through a shared workflow: establish the current drawing set, identify a specific discrepancy, show the original evidence, assign a correction, and verify the next revision. Give each role a useful view of that same evidence rather than building three separate products.

The first product promise worth testing is: **Find documentation and coordination discrepancies across a drawing set, and help reviewers verify that their comments were addressed.** Broad autonomous design review should follow demonstrated performance on individual checks.

“Super accurate” must be broken into reading accuracy, reference resolution, schedule reconciliation, citation support, revision matching, and defect detection. A system can read a title block accurately while missing a door symbol or misunderstanding a section. Confidence reported by a model is not a measurement of these capabilities.

## Confirmed source findings

- The project already implements native PDF text/geometry extraction, high-resolution regions, scanned-page OCR, sheet metadata, reference graphs, deterministic checks, cited Q&A, human review events, and structured revision comparison. These should be extended, not rebuilt.
- `backend/src/services/project-evidence.service.js` constructs Q&A evidence from sheet metadata, references, and AI findings. It does not promote `nativeText` or OCR blocks into retrievable source evidence. This limits questions about notes and schedules and allows an AI finding to become evidence for a subsequent AI answer.
- `backend/src/services/analysis.service.js` reviews one page at a time. It sends the overview and an available probable title-block crop, plus bounded OCR text when present. It does not send the whole related sheet context, the grid crops as detailed visual evidence, or native text blocks to this review call.
- `backend/src/services/high-resolution-region.service.js` uses a fixed 3-by-2 grid and a default lower-right title-block crop. These are useful initial mechanisms, but do not establish successful coverage of every schedule, rotated title block, small note, or dense detail.
- `backend/src/services/project-intelligence-result.js` validates citation identifiers and response structure. It does not independently prove that each statement follows from its cited evidence. `analysis-result.js` likewise gives findings a location and explanation without requiring an explicit source-evidence relationship.
- The six deterministic definitions in `project-check.service.js` focus on sheet numbers, reference states, and extraction uncertainty. They do not yet reconcile door/window schedules, dimensions, levels, specifications, or discipline conflicts.
- `sheet-reference.service.js` resolves a callout against the available sheet index. Existence of a target sheet does not establish existence of the referenced detail number on that sheet.
- `revision-comparison.js` matches sheets using normalized sheet numbers or page positions, compares five metadata fields, and matches findings by normalized category/title/sheet identity. A geometric change can therefore be missed by metadata comparison; different wording can alter finding identity. Neither disappearance of a finding nor an unchanged title block proves the design is corrected or unchanged.
- `loadProjectEvidence` loads project drawings without an explicit current-issue-set filter. That is a source-scope risk when old and new revisions coexist, not proof of a reproduced incorrect answer. It needs revision-specific tests.
- The evidence loader and index have bounded limits: 1,000 sheets, 2,000 references, 500 analysis records before selecting latest runs, and 3,000 indexed chunks. Coverage must be explicit before larger projects are accepted.
- The data model currently makes projects user-owned; it does not model organizations, invitations, project membership, assignees, or jurisdiction/stage context.
- The UI already labels the score as a heuristic and model confidence as uncalibrated. Preserve that honesty and make source coverage more prominent.

Validation performed: `npm run eval:rag` passed. Its three synthetic positive cases returned hit rate@3 and MRR of 1, with its hard-negative and rerank contract checks passing. This tests ranking logic with fixture vectors; it does not measure live extraction, embeddings, answering, or defect detection. No live-provider or browser end-to-end assessment was performed for this research.

## What external evidence supports

1. **Document reading and visual understanding need different evaluations.** [AECV-Bench](https://arxiv.org/abs/2601.04819) evaluates 120 floor plans and 192 drawing-grounded questions. Its reported results distinguish stronger OCR/text QA from substantially weaker symbol counting and spatial capabilities. This supports testing each skill separately, not borrowing a model's general reputation as an architectural accuracy claim. It is a research benchmark, not a Planly evaluation or certification.
2. **Alignment is part of revision comparison.** [Bluebeam's official alignment guide](https://support.bluebeam.com/revu/features/align-pdfs-with-overlay-pages.html) explains overlays and alignment points when drawings vary in size or scale. This supports adding visual comparison with alignment, including a human fallback, rather than comparing metadata alone.
3. **Finding changes and acting on them are established product expectations.** [TrunkReview](https://trunktools.com/tools/trunkreview/) advertises drawing overlays, non-clouded changes, revision narratives, and RFI preparation. These are vendor-described capabilities; this review did not independently validate the vendor's speed, completeness, or savings claims. Revision comparison alone will not differentiate Planly.
4. **Connected evidence is an existing competitive direction.** [TrunkBrowse](https://trunktools.com/tools/trunkbrowse/) describes linking drawing objects to schedules, specification sections, RFIs, and submittals. Planly should initially implement a narrow, reliable version, such as door tag → schedule row → specification clause.
5. **Professional issue handling requires ownership and context.** [Autodesk's issue documentation](https://help.autodesk.com/cloudhelp/ENG/Build-Issues/files/Issues_Create.html) includes assignment, locations, dates, root causes, attachments, and sheet placement. These support adding actionable coordination to Planly's existing review decisions.
6. **Review-comment continuity is a reported user problem.** A [construction reviewer's public post](https://www.reddit.com/r/automation/comments/1nx0qnq/looking_for_pdf_drawing_review_automation/) describes time spent checking whether comments were picked up and locating old comments when page numbering changes. This is an anecdotal demand signal, not representative evidence about all architects or contractors.

The market sources show plausible jobs and established workflows. They do not tell us exactly what Planly's customers will buy. That requires observing real reviews and collecting project-specific feedback.

## Prioritized additions

### First: trust and accuracy foundations

**1. A real-project evaluation corpus.** Obtain permission to use representative vector PDFs, scans, dense schedules, rotated sheets, different title blocks, and successive revisions. Start with a manageable pilot corpus, such as 5–10 projects and 100–200 reviewed task cases; this is an initial experiment, not statistically sufficient certification. Include correct examples, actual defects, unreadable evidence, missing documents, and questions that cannot be answered. Split by project, not by page, to reduce leakage. Have qualified reviewers adjudicate disputed labels. Measure extraction, retrieval, findings, and revision comparison independently.

**2. A versioned current drawing set.** Add project issue packages and a current/superseded state for each sheet. Architectural, structural, and MEP PDFs may belong to one package even when uploaded separately. Ask users to confirm ambiguous matches. Scope search, checks, reference resolution, answers, and reports to the chosen package. Keep history accessible and cite exactly which version supports a claim. This prevents a plausible answer drawn from an obsolete sheet.

**3. Source-first evidence search.** Index native text blocks and OCR words with sheet, revision, bounding box, extraction method, and provenance. Keep schedule rows together; retain their headers, units, and nearby context. Let users search an exact tag, detail number, or note and jump to its source. Index AI findings separately as interpretations. An answer may summarize a finding but should not claim independent corroboration from that finding alone.

**4. Detailed visual review and coverage.** Preserve the overview, then inspect relevant high-resolution regions for requested checks. Detect actual title blocks, schedules, legends, and details instead of assuming one fixed location. Native text should be preferred when reliable; use OCR where needed. Track what was processed, unreadable, skipped, truncated, or failed. A reference check with no extracted references must not imply that all visible references were inspected successfully. Prefer `NOT_EVALUATED` or `INSUFFICIENT_EVIDENCE` when required inputs are absent.

**5. Evidence requirements and verification.** Require each finding to identify the observed fact, applicable rule/check, supporting source regions, and uncertainty. For contradictions, show both sides. Validate exact identifiers, numbers, units, and source version using deterministic logic where possible. For narrative answers, verify claims against their citations; a second model can help triage but is not independent proof. Recheck numeric values in the source crop before presenting a consequential discrepancy.

**6. Model selection based on measured task performance.** Compare approved providers/models on the same held-out corpus. Choose separately for text extraction, visual symbols, retrieval, and explanations. Record model/prompt/extraction versions, cost, error rate, and latency. Free models can be useful for development; “free” or “different model IDs” are not quality criteria. Approve data handling for confidential drawings before a real pilot. Add a paid or specialist model only if its measured gain warrants cost and retention tradeoffs.

### Next: checks that solve core architectural problems

**7. Full callout validation.** Extend sheet existence to detail existence: `3/A501` must resolve to sheet A501 and detail 3 within the selected issue package. Link directly to the target region, including references across separately uploaded discipline PDFs. Classify illegible callouts and external-document references separately from broken references.

**8. Plan–schedule–specification reconciliation.** Begin with doors, then windows and room finishes. Find a door tag missing from its schedule, a schedule row with no corresponding plan tag, conflicting ratings, or inconsistent width notation. Preserve distinctions such as leaf width versus clear opening width. Add specifications after reliably extracting the plan/schedule pair. Each conflict needs two cited sources; repeated tags may be intentional and need documented exceptions.

**9. Cross-view and discipline discrepancy checks.** Start with explicit information: level annotations, grid labels, dimensions, room identities, and referenced openings across plan, section, elevation, structural, and MEP documents. Build one check family at a time. A PDF can expose contradictory level text or an apparent overlap; proving a physical 3D clash requires sufficient geometry, elevations, or model data. Report a coordination risk when the inputs cannot establish a clash.

**10. Project context and focused check profiles.** Collect location/jurisdiction, building use, project stage, disciplines, units, applicable standards/editions, and expected documents. Configure small versioned check profiles for pre-issue QA, revision review, and discipline coordination. Avoid applying construction-detail requirements to an early concept set. Introduce jurisdiction-specific compliance checks only with maintained, permitted sources, applicability rules, and expert-reviewed cases. Launch one validated jurisdiction/check family before broad coverage.

### Then: make findings lead to completed work

**11. Real revision comparison and comment continuity.** Match sheets despite reorderings and renumbering, with user-confirmed mappings where uncertain. Align actual content, not just page borders; offer manual alignment. Compare text and relevant visual regions, including changes without revision clouds. Carry stable review-comment identities forward independently of AI wording. For each prior issue show `still present`, `candidate fix`, `cannot verify`, or `reviewer confirmed resolved`. A missing model detection must not automatically close an issue.

**12. Team coordination.** Add organizations, project memberships, scoped roles, assignee, due date, discipline, comments, and attachments. Preserve the existing immutable review history. Separate “correction submitted” from “verified resolved.” This makes the same discrepancy useful to its architect reviewer, consultant owner, and contractor reader. Enforce membership on every document, asset, search, and export operation.

**13. Portable evidence and RFI drafts.** Extend the existing CSV register with a PDF review packet: source crops, exact versions, issue IDs, decisions, responsible people, and comparison evidence. Create an RFI draft from a selected unresolved discrepancy, with both citations and a clear question. Users review it before sending. Validate the export format with users first; add one integration to the system pilot teams already use after portable exports work.

**14. Outcome-based feedback and review coverage.** Ask why findings were edited/dismissed: wrong extraction, intentional exception, duplicate, obsolete revision, unsupported rule, or genuinely irrelevant. Capture missed issues too. Do not treat every dismissal as a false positive or every acceptance as confirmed truth. Show enabled checks, evaluated sheets/regions, unresolved blockers, and required reviewers. Support frozen issue-package sign-off, explicitly scoped to the checks and professional review performed.

## Architecture and implementation sequence

Keep the existing Express/Prisma application and extend its boundaries:

1. PDF/native extraction and OCR services own source artifacts and coordinate transforms.
2. A project issue-package model owns revision selection and sheet identity.
3. Evidence services own versioned source blocks, provenance, indexing, and retrieval.
4. Domain check services compare explicit facts; AI services propose interpretations or structured extractions.
5. Revision services own alignment, changes, and comment lineage.
6. Review services own assignment, decisions, and sign-off. The client makes evidence inspection fast.

The asynchronous request lifecycle should remain: validate membership and input → persist a job and selected source versions → process extraction/checks → persist results with coverage and provenance → show progress/failure → collect human decisions. Source versions must not drift during a run.

For multiple API/worker instances, add atomic database claiming with leases/idempotency and shared private object storage. Start with the existing database rather than requiring a new distributed system. Introduce PostgreSQL full-text/vector indexes when measured corpus size and latency justify them. Bound PDF processing resources as well as file bytes, and expose provider/OCR failures rather than representing them as a clean review.

A practical first vertical slice is **door plan–schedule reconciliation**:

- The reviewer selects the current issue package and relevant plan/schedule sheets.
- Extract door tags and schedule rows, retaining source bounds and units.
- Let the reviewer correct uncertain extraction.
- Compare exact facts using a small deterministic rule set.
- Show the cited discrepancy, assign it, and export it.
- Upload a revision and propose whether the discrepancy persists or is corrected.
- Evaluate the complete slice against reviewed cases before expanding to windows or other disciplines.

Do not implement all fourteen additions at once. First build the corpus, current-version scope, source evidence, and one dependable check. Add revision verification and team workflow around that check. Expand only after observed use supports the next check family.

## How to establish usefulness with customers

Recruit a small mixed pilot group: architect reviewers, discipline consultants, and contractor/project engineers. Observe actual drawing reviews; ask for recently found errors and a pair of revisions, with permission. Have users perform the same tasks with their existing process and Planly. Record time to find evidence, correct AI output, decide a finding, and verify a revision.

Ask concrete questions: “Show the last issue that required multiple documents”; “Who fixes it and how do you confirm that?”; “Which irrelevant alerts would make you stop using this?”; “What export must leave this system?” Avoid asking whether users want more AI features.

Proposed pilot gates, to be adjusted with reviewers and sample sizes:

- No fabricated source identifiers or cross-project/source-version leakage in the reviewed cases.
- Measure finding precision and recall together, including by severity; fewer alerts are not proof of higher accuracy.
- Set a check-specific precision target, for example 95% for displayed deterministic discrepancy alerts, only after defining labels and collecting enough cases. Report uncertainty and failures; this is a target, not current performance.
- Measure unsupported-answer rate and appropriate abstention alongside answer correctness, so refusing everything cannot appear successful.
- For revision review, test both true corrections and persisting problems. Incorrect “resolved” proposals are a key error class.
- Aim for meaningful review-time savings after correction time is included, for example a 25% pilot reduction; validate this rather than advertising it in advance.
- Track cost per reviewed sheet/package, p95 time to first useful result, extraction failures, provider errors, and rerun reliability.

The product is useful when users can trust its evidence, finish a real review task faster, and verify corrections with less manual reconstruction. More modes, broad compliance claims, automatic construction costing, and autonomous approval should wait for that evidence.
