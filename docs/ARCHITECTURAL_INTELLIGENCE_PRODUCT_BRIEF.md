# Planly Architectural Intelligence Product Brief

> Product UI is part of the product contract. Every roadmap item in this brief must follow the [Planly UI Design System](UI_DESIGN_SYSTEM.md), including its evidence, accessibility, responsive, motion, and visual-QA requirements.

Last researched: August 12, 2026

Status: Living product and engineering context

Audience: Product, design, engineering, AI/evaluation, and go-to-market

## Why this document exists

This document preserves the product reasoning behind Planly so future implementation work does not collapse into a disconnected feature list or a generic “chat with your PDF” product.

It records:

- the professional problems worth solving;
- evidence behind those problems;
- what established and emerging products already offer;
- differentiated opportunities worth validating;
- what “AI-native” should mean for Planly;
- a sequenced product and engineering roadmap;
- trust, evaluation, security, and business requirements;
- assumptions that still need customer validation.

This is a strategy document, not proof that every market statement will remain true. Competitor capabilities change quickly. Revalidate the market before committing to a major roadmap bet.

## Product thesis

Planly should become the **decision and verification layer between architectural intent and construction reality**.

The product should help architects and engineers answer five questions:

1. What is present, absent, inconsistent, or ambiguous in this drawing set?
2. Why does it matter for this project, jurisdiction, discipline, and stage?
3. What evidence supports the finding?
4. Who decided what to do, and why?
5. Did the next revision actually resolve the problem without creating another one?

The core loop is:

> Ingest project context → understand the drawing set → find evidence-backed risks → obtain human judgment → turn decisions into actions → verify the next revision → learn from downstream outcomes.

Planly should not claim to replace professional judgment. It should remove information-processing work around judgment and make the judgment more complete, traceable, and reusable.

## What “Architectural Intelligence” means

Architectural Intelligence is not:

- one large prompt over page images;
- a chatbot that can summarize a PDF;
- ungrounded claims of code compliance;
- a black-box score;
- automatic design decisions without professional review;
- a generic document management system with an AI button.

Architectural Intelligence is a system that:

- constructs a semantic model of sheets, spaces, assemblies, schedules, references, requirements, revisions, issues, and decisions;
- understands the current project state and its history;
- combines deterministic checks with specialist AI reasoning;
- cites the exact visible and documentary evidence for each claim;
- distinguishes facts, inferences, uncertainties, and professional decisions;
- keeps the architect or engineer accountable for approval;
- remembers review outcomes and uses them to improve future checks;
- connects design-stage signals to RFIs, submittals, change events, field observations, and rework;
- takes reversible workflow actions with explicit human approval.

Autodesk describes AI-native AEC software as AI embedded where project data and workflows already live, capable of acting across connected specifications, issues, RFIs, and other records rather than operating as a detached chatbot. Planly should adopt that product principle without trying to reproduce the entire Autodesk platform. See [Autodesk Assistant: AI-native intelligence in Forma](https://www.autodesk.com/blogs/construction/meet-autodesk-assistant-ai-native-intelligence-in-forma/).

## Who Planly should serve first

### Primary initial customer

Small and mid-sized architecture and multidisciplinary design firms that:

- produce PDF construction-document sets;
- have limited dedicated QA/QC capacity;
- rely on senior staff for final review;
- experience deadline-driven review compression;
- absorb construction-administration effort that was not fully priced;
- want fewer preventable RFIs, coordination comments, and permit resubmissions;
- cannot deploy an enterprise BIM analytics program.

### Initial users

| User | Job to be done | Current frustration | Desired outcome |
| --- | --- | --- | --- |
| Project architect | Issue a coordinated set | Final review happens under deadline pressure | Know the highest-risk gaps before issue |
| Discipline engineer | Coordinate technical information | Conflicts are spread across sheets and schedules | See exact cross-document inconsistencies |
| Senior QA reviewer | Apply experience efficiently | Time is spent hunting rather than judging | Review prioritized evidence, not every page equally |
| Emerging professional | Learn QA/QC patterns | Standards and office knowledge are implicit | Receive explainable guidance tied to firm standards |
| Construction administrator | Protect intent and maintain a record | RFIs, submittals, emails, and decisions are fragmented | Retrieve context and maintain defensible decisions |
| Practice leader | Protect margin and reduce risk | Rework and CA effort are difficult to attribute | Measure preventable issues and fee leakage |

### Do not start with everyone

Owners, contractors, authorities having jurisdiction, and very large enterprise BIM teams may become valuable customers, but optimizing for all of them initially would dilute the product. Start with the architect/engineer QA and revision-resolution loop.

## Evidence-backed pain points

### 1. Final QA/QC is broad, manual, and deadline compressed

Professional QA guidance expects teams to check completeness, clarity, cross-sheet consistency, code/accessibility, specification alignment, consultant overlays, RFIs, submittals, changes, field observations, and closeout records. This is too much to execute consistently as an unstructured final redline exercise.

The AIA Trust’s current QA/QC checklist explicitly calls for completeness and clarity, consistency across plans/sections/elevations/schedules, code and accessibility review, drawing/specification coordination, consultant overlays, documented RFIs, tracked changes, and reviewed as-builts. See [QA/QC Essentials for a Successful Construction Project](https://theaiatrust.com/wp-content/uploads/2025/10/QA_QC_Checklist_for_Architects_Updated-1-PLS-redline-101425.pdf).

**Product implication:** Planly should convert firm QA knowledge into repeatable checks that run continuously, not only at issuance.

### 2. Cross-discipline and cross-document inconsistencies become downstream work

Drawings, schedules, specifications, consultant documents, and later clarifications are authored separately. Visual correctness on one sheet does not establish consistency across the set.

Autodesk/FMI research reported that project teams spend substantial time searching for information, resolving conflict, and handling mistakes, and attributed a large share of rework to poor data and miscommunication. The exact historical estimates should not become Planly marketing claims without careful context, but the workflow problem is well established. See [Construction Disconnected](https://www.autodesk.com/blogs/construction/construction-disconnected-fmi-report/) and [Data Advantage in Construction](https://construction.autodesk.com/resources/guides/harnessing-data-advantage-in-construction/).

**Product implication:** Finding relationships and contradictions is more valuable than producing isolated page comments.

### 3. Revision comparison shows pixels, not intent or resolution

Current tools can compare sheets and highlight additions, removals, and modifications. Autodesk supports side-by-side and overlay comparison, while its drawing tools identify changed objects. These features answer “what changed visually,” but the professional still must determine whether a known concern was fixed and whether collateral inconsistencies appeared.

Sources:

- [Autodesk Compare Sheets](https://help.autodesk.com/cloudhelp/ENU/Build-Sheets/files/Compare_Sheets.html)
- [AutoCAD Architecture Drawing Compare](https://help.autodesk.com/cloudhelp/2024/ENU/AutoCAD-Architecture/files/GUID-20918F56-EDE6-42B6-AE13-E06CB0C66D37.htm)

**Product implication:** Planly should build intent-aware revision verification, not only visual diff.

### 4. Construction administration is record-intensive, time-sensitive, and difficult to price

AIA material describes construction administration as especially time-consuming and record-intensive, with legal implications and a need for timely, thorough documentation. More recent AIA guidance notes fragmented communication, email-based workflows, missing decision records, uncompensated administrative effort, and lost visibility during construction.

Sources:

- [AIA construction administration guidance](https://content.aia.org/sites/default/files/2017-03/EPC_Construction_Admin_3B.pdf)
- [Five construction administration risks architects cannot ignore](https://www.aia.org/article/5-construction-administration-risks-architects-cant-ignore)
- [The future of construction administration: what AI changes and what it does not](https://www.aia.org/article/future-construction-administration-what-ai-changes-and-what-it-doesnt)

**Product implication:** Decision history, routing, prior-answer retrieval, and fee-leakage evidence can be as valuable as drawing review.

### 5. Architects must preserve judgment and accountability

Architecture is a regulated profession. NCARB’s practice research emphasizes construction documents, documentation, detailing, codes, life safety, accessibility, coordination, constructability, risk management, and construction administration as important professional knowledge areas. A large majority of respondents also believe some project components require an architect’s approval.

Sources:

- [NCARB Analysis of Practice full report](https://www.ncarb.org/sites/default/files/Analysis-of-Practice-Full-Report-2023.pdf)
- [NCARB report highlights](https://www.ncarb.org/blog/explore-the-2022-analysis-of-practice-report)

**Product implication:** AI should prepare evidence and proposed actions; licensed professionals retain decisions and sign-off.

### 6. AI adoption is constrained by trust, interoperability, data quality, and cost

RIBA’s 2025 AI report identifies interoperability, infrastructure, subscription risk for smaller practices, poorly structured data, regulatory gaps, and lack of confidence as adoption challenges.

Source: [RIBA AI Report 2025](https://www.architecture.com/-/media/GatherContent/Business-Benchmarking/Additional-Documents/RIBA-AI-report-2025-FINALpdf.pdf)

**Product implication:** Planly needs measurable accuracy, open exports, integration paths, visible evidence, and predictable per-project economics.

### 7. Sheet ingestion itself is imperfect

Established tools use OCR to extract sheet numbers and title-block attributes, but their documentation acknowledges blank or incorrect extraction, orientation problems, ambiguous characters, and dependence on export quality.

Sources:

- [Autodesk review and edit sheet numbers](https://help.autodesk.com/cloudhelp/ENU/Build-Sheets/files/upload-sheets-and-publish/Review_Edit_Sheet_Numbers_Autodesk_Build.html)
- [Autodesk drawing extraction authoring guide](https://help.autodesk.com/cloudhelp/ENG/Docs-Files/files/automated-drawing-extraction/Automated_Drawing_Extraction_Authoring_Guide.html)

**Product implication:** Ingestion must expose confidence, support quick correction, remember title-block templates, and never hide uncertain sheet identity.

## Current market capability map

This is a directional map based on public product material, not a procurement-grade comparison.

| Capability | Examples currently offering it | Lesson for Planly |
| --- | --- | --- |
| Drawing storage, permissions, markup, revision history | Procore, Autodesk, Bluebeam | Table stakes; integrate rather than rebuilding an entire CDE initially |
| OCR sheet extraction and automatic links | Autodesk, Procore | Needed for set understanding, but correction UX matters |
| Visual revision comparison | Autodesk, Procore, Bluebeam, Deta | Visual diff alone is not differentiation |
| Specification/submittal comparison with citations | Part3, Autodesk AutoSpecs | Evidence-linked recommendations are the minimum trust bar |
| AI drawing QA/QC and code-risk review | Structured, Nomic, Callout, Lintel, ArchiChecker, DrawInspect | Generic “AI plan review” is already crowded |
| Drawing-set chat with citations | Structured, Lintel, Autodesk Assistant | Chat is a useful interface, not the product moat |
| Custom checks in natural language | Structured, Lintel and emerging competitors | Firm-specific checks should be versioned and evaluated, not just prompted |
| Cross-discipline overlay/clash | Structured and coordination platforms | Combine geometric overlays with semantic inconsistency detection |
| Revit/model checks | Structured, ArchiChecker and established BIM tools | PDF-first can win initially, but structured model access improves determinism |
| RFI creation/linking | Procore and AI review integrations | Planly should detect preventable RFIs and preserve decision lineage |
| Human issue workflow | Procore, Autodesk, Bluebeam and newer review tools | Required, but not sufficient differentiation |

Representative sources:

- [Procore drawing management](https://www.procore.com/en-ca/project-management/drawings)
- [Procore drawing-linked RFIs](https://en-gb.support.procore.com/products/online/user-guide/project-level/drawings/tutorials/create-or-link-rfis-on-a-drawing)
- [Bluebeam collaboration](https://www.bluebeam.com/product/collaboration-and-mobility/)
- [Part3 Submittal Assistant](https://www.part3.io/submittal-assistant)
- [Structured AI](https://getstructured.ai/)
- [Nomic drawing review](https://www.nomic.ai/use-cases/automated-drawing-review/ai-drawing-review-software-aec-qa-qc)
- [Lintel](https://www.uselintel.com/)
- [Callout](https://www.callout.app/)
- [ArchiChecker](https://www.archichecker.com/)

## Differentiated opportunity hypotheses

The following are plausible market gaps or underdeveloped workflows based on public competitor material. They must be validated in interviews and pilots. Do not market them as universally absent from every competitor.

### 1. Intent-aware revision verification

Most comparison workflows identify changed geometry or pixels. Planly can ask:

- What did the author say this revision intended to fix?
- Which accepted findings should this revision resolve?
- Was each issue actually resolved?
- Did the change introduce a schedule, detail, egress, accessibility, or consultant inconsistency elsewhere?
- Were unrelated areas changed unexpectedly?

Output: `fixed`, `partially fixed`, `still present`, `regressed`, `new collateral risk`, with evidence from both versions.

### 2. Decision lineage attached to geometry

Store the relationship:

`requirement → finding → discussion → professional decision → drawing location → revision → verification → downstream outcome`

This creates a reusable, defensible project memory. A future reviewer should be able to select a door, room, detail, or issue and understand why it is that way.

### 3. Preventable-RFI simulator

Before issue, simulate questions likely to come from a contractor:

- Is the answer already present but difficult to find?
- Is the information contradictory?
- Is a dimension, material, detail, responsibility, tolerance, or sequence genuinely missing?
- Which discipline should answer?
- What would a good clarification need to contain?

After construction begins, connect actual RFIs to predicted RFIs and improve the check library.

### 4. Fee-leakage and scope intelligence for architects

Architecture products rarely make uncompensated coordination work visible. Planly can:

- classify CA effort by contracted versus additional service;
- detect repeat questions already answered in the documents;
- identify excessive resubmittals and repeated review cycles;
- reconstruct time spent on decisions and follow-ups;
- warn when CA workload is diverging from fee assumptions;
- produce evidence for a scope or additional-services conversation.

This is commercially meaningful because AIA guidance identifies CA effort, fragmented information, and work absorbed without increased fees as practice risks.

### 5. Ambiguity and constructability uncertainty map

Rather than pretending every finding is a violation, locate places where the field must infer intent:

- unresolved intersections;
- missing continuation details;
- unclear responsibility boundaries;
- conflicting dimensions;
- missing tolerances or sequencing information;
- details that exist but cannot be traced from the plan;
- “technically present, operationally hard to find” information.

Rank ambiguity by likely downstream decision cost.

### 6. Standard-of-care evidence ledger

Create an immutable audit package containing:

- which checks ran;
- inputs and document versions;
- model and prompt versions;
- deterministic tool outputs;
- AI evidence and uncertainty;
- reviewer decisions and changes;
- unresolved exceptions;
- sign-off time and responsible person.

This is not a guarantee against liability. It provides a more defensible and teachable QA process.

### 7. Firm-memory compiler

Convert previous redlines, accepted/dismissed findings, office standards, RFIs, and postmortems into:

- candidate checks;
- examples and counterexamples;
- reusable review templates;
- evaluation cases;
- discipline-specific guidance;
- onboarding material for emerging professionals.

Humans approve every promoted check. The system should show which historical decisions support it.

### 8. Requirement-to-drawing coverage

Create a coverage map from owner requirements, room data, accessibility criteria, specifications, meeting decisions, and code obligations to visible drawing evidence.

Highlight requirements that are:

- documented;
- contradicted;
- changed without approval;
- not yet represented;
- represented only in one document when coordination requires several.

This protects design intent and identifies “missingness,” one of the hardest review tasks.

### 9. Review routing based on uncertainty and impact

Route work according to professional value:

- deterministic and low-risk checks can be auto-cleared or junior-reviewed;
- high-confidence coordination findings go to the responsible discipline;
- uncertain but high-impact findings go to senior reviewers;
- repeated dismissed patterns are suppressed for that organization;
- life-safety and accessibility findings always require named sign-off.

This uses senior attention as a scarce resource.

### 10. Outcome-linked intelligence

Connect design review to actual project consequences:

- RFIs;
- change orders;
- submittal resubmissions;
- permit comments;
- field observations;
- punch-list items;
- rework cost and schedule impact.

Then answer: “Which upstream document signals predicted this outcome, and which check would have caught it?” This creates a defensible data advantage that a generic foundation model does not have.

## Prioritized roadmap

Priority is based on user value, prerequisite order, differentiation, trust, and implementation risk.

## Phase 0 — Reliable product foundation

Goal: make the current product safe enough for controlled pilots.

### P0.1 Organization and project access model

- Organizations/workspaces.
- Membership and invitations.
- Owner, admin, reviewer, contributor, and viewer roles.
- Project-specific guest access.
- Audit events for access and document actions.
- Organization data isolation tests.

### P0.2 Production object storage

- S3-compatible storage abstraction.
- Direct or multipart uploads.
- Signed read URLs.
- Virus/malware scanning.
- Region, retention, legal hold, and deletion policies.
- Asset reconciliation for database/storage drift.

### P0.3 Durable distributed execution

- Atomic PostgreSQL run claiming or a managed job service.
- Per-organization and global concurrency budgets.
- Lease expiry and heartbeat.
- Idempotent page execution.
- Cancellation.
- Exponential retry by failure class.
- Dead-letter and operator replay workflow.

### P0.4 Observability and quality

- Structured application logs with user-safe redaction.
- Error monitoring.
- Metrics for queue time, render time, provider time, page throughput, failures, and cost.
- Backend service/route integration tests.
- Browser end-to-end tests.
- A staging provider smoke suite with spending caps.
- Backup restoration drills.

### P0.5 Usage and commercial controls

- Token, image, page, and cost ledger per run.
- Organization quotas.
- Budget alerts and hard caps.
- Subscription and entitlement model.
- Retention and export controls.
- Transparent “estimated cost before run.”

## Phase 1 — Drawing-set intelligence

Goal: understand a full issue set before attempting deeper reasoning.

### P1.1 Sheet ingestion and correction

Implementation status as of August 13, 2026: the first vertical slice is implemented. Page-level vision analysis now extracts sheet number, title, discipline, revision, and issue date with confidence and evidence; users can correct or confirm the result; corrections survive reruns; and deterministic missing/duplicate-number diagnostics are available. Drawing-set entities, reusable title-block templates, richer sequence rules, and normalized revision history remain open.

- Split multi-sheet PDFs.
- OCR sheet number, title, revision, discipline, date, and project metadata.
- Detect title-block regions and reusable templates.
- Confidence and reason for every extracted field.
- Fast bulk correction UX.
- Duplicate, missing, and out-of-sequence sheet detection.
- Persist normalized `DrawingSet`, `Sheet`, and `SheetRevision` entities.

### P1.2 Sheet graph

Implementation status as of August 13, 2026: the first vertical slice is implemented. Page analysis extracts visible detail, section, elevation, schedule, plan, and general sheet references with confidence, evidence, and callout location. Persisted edges resolve against the human-correctable sheet index and flag missing, ambiguous, or low-confidence targets. Correcting sheet metadata reconciles the graph immediately without another model call. Symbol-specific extraction evaluation, circular-reference analysis, schedule/tag linking, and richer spatial/project entities remain open.

- Detect plan, section, elevation, detail, schedule, and legend types.
- Extract and link callouts.
- Identify broken, ambiguous, or circular references.
- Link schedules to tagged elements where possible.
- Represent spaces, levels, zones, disciplines, and details in a project graph.

### P1.3 Search and cited set questions

Implementation status as of August 19, 2026: the MVP retrieval slice is implemented. Users can search current sheet metadata, findings, and references across a project, then ask bounded-context questions. Project-scoped evidence chunks persist content hashes and optional embeddings; reciprocal rank fusion combines semantic and keyword retrieval; and unavailable embeddings visibly degrade to lexical search. Answers persist the evidence snapshot, provider/model metadata, confidence, sheet/page/region citations, retrieval mode, candidate scores, and fallback reason. Unknown citations and uncited substantive answers are rejected, while empty retrieval returns insufficient evidence. A deterministic retrieval smoke eval gates hit rate and MRR. Full drawing OCR, symbol search, pgvector/full-text indexes, a real-project golden dataset, streaming, and question-to-revision comparison remain open.

- Search text, symbols, sheet metadata, findings, and references.
- Ask questions across the set.
- Every answer links to sheet and bounding region.
- Explicit “not found” and insufficient-evidence behavior.
- Never answer solely from model memory when project evidence is required.

Success signal: reviewers can locate information and understand set structure substantially faster than with a PDF viewer.

## Phase 2 — Continuous QA intelligence

Goal: replace deadline-only redlining with repeatable, evidence-backed review.

### P2.1 Check framework

Implementation status as of August 15, 2026: the first deterministic check-library slice is implemented. Six documented, versioned checks cover missing and duplicate sheet numbers, broken and ambiguous references, and low-confidence metadata/references. Each project can enable or disable a check and change its severity; live results include cited sheet/page/region evidence. Organization libraries, custom check authoring, AI check definitions, templates, preview datasets, rollback, and persisted run history remain open.

- Deterministic checks for metadata, references, numbering, duplicates, and schedule consistency.
- AI checks for ambiguity, completeness, coordination risk, and constructability.
- Check definition: purpose, scope, inputs, expected evidence, exclusions, severity rubric, owner, and version.
- Organization check library.
- Project-type templates.
- Check preview on sample pages.
- Version comparison and rollback.

### P2.2 Specialist review pipeline

- Documentation completeness reviewer.
- Accessibility-risk reviewer.
- Life-safety-risk reviewer.
- Constructability reviewer.
- Architectural/structural/MEP coordination reviewers.
- Specification/drawing consistency reviewer.
- Evidence verifier.
- Finding deduplicator and priority calibrator.

Use specialized stages because one broad prompt cannot be evaluated or improved precisely.

### P2.3 Human review workspace

- Accept, edit, dismiss, resolve, and reopen.
- Dismissal reason and false-positive category.
- Assignee, due date, discipline, watcher, and comment.
- Bulk triage.
- Saved filters.
- Required sign-off by risk class.
- Exportable review register.

Success signal: high-impact finding acceptance increases while reviewer minutes per sheet decrease.

## Phase 3 — Revision and resolution intelligence

Goal: prove what a revision accomplished.

### P3.1 Revision matching and alignment

Implementation status as of August 16, 2026: the first vertical slice is implemented. Users can link a new drawing upload to an earlier project drawing, match sheets by normalized sheet number with an explicit page-position fallback, inspect added, removed, metadata-modified, and unchanged sheets side by side, and compare new, resolved, and persisting findings. The UI exposes the deterministic matching method and explicitly avoids claiming pixel-level geometry changes. Content fingerprints, scale/crop/rotation alignment, visual overlays, moved-region detection, and human match correction remain open.

- Match sheets using metadata, title block, content fingerprint, and human correction.
- Align different scale, crop, rotation, and raster/vector exports.
- Visual overlay and side-by-side comparison.
- Added, removed, modified, and moved regions.

### P3.2 Intent-aware verification

- Reviewer records intended changes or links findings to the revision.
- Verify each linked issue against new evidence.
- Detect collateral inconsistency across related sheets and schedules.
- Identify unexpected changes outside declared scope.
- Carry unresolved issues forward.
- Create a signed revision-verification report.

### P3.3 Regression intelligence

- Re-run only checks affected by changed regions and related graph nodes.
- Explain why a check was selected.
- Compare readiness and risk changes without pretending scores are absolute truth.

Success signal: teams can prove resolution faster and catch regressions before reissue.

## Phase 4 — Grounded requirements and compliance-risk intelligence

Goal: evaluate drawings against the correct project-specific sources.

### P4.1 Source management

- Jurisdiction and code year.
- Local amendments.
- Owner design requirements.
- Firm standards.
- Project specifications.
- Room data sheets.
- Accessibility and life-safety narratives.
- Source version, effective date, and applicability metadata.

### P4.2 Evidence model

Every requirement-sensitive finding stores:

- observed drawing fact;
- source quotation within copyright limits;
- source identifier and location;
- applicability reasoning;
- uncertainty;
- conflicting sources;
- required professional reviewer;
- final human disposition.

### P4.3 Requirement coverage

- Map requirements to sheets, details, schedules, and elements.
- Detect unsupported or contradicted requirements.
- Identify decisions not reflected in current documents.
- Generate a submission evidence matrix.

Success signal: users trust findings because they can verify both drawing evidence and source applicability.

## Phase 5 — Construction administration intelligence

Goal: reduce unpriced information-processing work while preserving architect judgment.

### P5.1 Project correspondence memory

- Ingest approved emails, meeting minutes, RFIs, submittals, ASIs, and decision logs.
- Retrieve prior decisions with citations.
- Connect decisions to drawing regions and requirements.
- Detect inconsistent new responses.

### P5.2 RFI intelligence

- Predict likely RFIs before issuance.
- Classify whether an incoming RFI is answered, ambiguous, missing, coordination-related, or scope-related.
- Draft a response with cited project evidence.
- Show similar previous decisions.
- Require professional approval.
- Track repeated and preventable RFIs.

### P5.3 Submittal intelligence

- Compare product data and shop drawings with specifications and design intent.
- Show requirement, submitted evidence, exact gap, and recommendation.
- Detect incomplete contractor review.
- Track resubmission differences.
- Flag substitution and warranty/maintenance implications.

### P5.4 Fee and scope intelligence

- Compare actual CA activity with the contracted service model.
- Detect repeated review cycles and late scope changes.
- Attribute unplanned effort to causes.
- Prepare a factual additional-services evidence package.
- Never make a contractual conclusion without user review.

Success signal: less time finding context, faster responses, and better visibility into CA margin.

## Phase 6 — Outcome learning and predictive risk

Goal: learn which review signals actually matter.

- Connect accepted findings to RFIs, permit comments, changes, rework, and field outcomes.
- Build organization-specific risk calibration.
- Identify recurring sheet, discipline, consultant, and project-type patterns.
- Recommend checks based on project characteristics.
- Estimate likely downstream impact with a clear explanation and uncertainty range.
- Run prospective evaluations before enabling predictive behavior in production.

Do not train predictive models from unreviewed AI output. Human-reviewed findings and real outcomes are required.

## Small features with disproportionate value

These can improve adoption before the larger intelligence platform exists:

- “Copy link to exact finding” with page, zoom, and selected evidence.
- Keyboard-first finding triage.
- Reviewer reason required when dismissing high-severity findings.
- One-click “show related sheets/details.”
- Side-by-side source and drawing evidence.
- Firm terminology dictionary and abbreviation expansion.
- Automatic drawing index from uploaded set.
- Missing/duplicate sheet warning before any paid AI run.
- Estimated page count, runtime, and cost before starting.
- Cancel analysis.
- Per-page progress and failure retry.
- “Only show changes since last run.”
- “What should a senior reviewer look at?” prioritized review queue.
- Export to CSV, PDF, BCF, and issue-management formats.
- Read-only expiring report links.
- Branded submission-readiness report.
- Finding templates for office-standard redline language.
- Learning mode that explains why a check exists.
- Review coverage heatmap by sheet and discipline.
- Unreviewed-evidence warning before sign-off.
- Prompt/model/check version visible in report details.
- Data-retention and “do not train” controls visible to administrators.

## AI system architecture principles

### 1. Parse before reasoning

Extract deterministic structure first:

- PDF text and vector information when available;
- page dimensions and coordinates;
- title block fields;
- sheet graph and references;
- OCR tokens with confidence;
- tables and schedules;
- visual regions and symbols.

Reasoning agents should consume structured artifacts plus cropped evidence, not repeatedly inspect every full-resolution page from scratch.

### 2. Use deterministic checks where possible

Use code for:

- duplicate/missing identifiers;
- numbering and reference integrity;
- exact schedule comparisons;
- required metadata;
- arithmetic and dimensional calculations;
- run state and permissions;
- source version applicability.

Use models for:

- semantic equivalence;
- ambiguity;
- likely constructability concern;
- cross-document explanation;
- ranking and proposed action.

### 3. Separate retrieval, observation, inference, and decision

Each finding should preserve:

```text
source requirements
        ↓
retrieved drawing/document evidence
        ↓
machine observation
        ↓
machine inference + uncertainty
        ↓
human disposition and action
```

This separation makes errors diagnosable and reviews defensible.

### 4. Prefer specialist checks over a universal agent

A universal agent is difficult to evaluate. A specific check—such as “door schedule and plan tag consistency”—has a defined input, expected output, exclusions, test set, and owner.

### 5. AI actions must be reversible and approval-gated

AI may draft, route, classify, suggest, and prepare. Publishing an RFI, changing an issue status in an external system, approving a submittal, or signing a report requires explicit authorization and an audit event.

### 6. Treat project data as confidential

- Do not train on customer data by default.
- Record provider retention settings.
- Minimize data sent to providers.
- Isolate organizations.
- Support deletion and export.
- Redact secrets and personally identifiable information from logs.
- Make data flows explainable to customers.

## Evaluation strategy

AI-native quality requires an evaluation system before it requires more agents.

### Evaluation unit

Evaluate one named check against a reviewed case containing:

- document/version identifiers;
- expected evidence regions;
- expected finding or expected clean result;
- acceptable alternate interpretations;
- risk class;
- reviewer rationale.

### Core metrics

| Metric | Why it matters |
| --- | --- |
| Finding precision | Noise destroys reviewer trust |
| High-risk recall | Missing critical issues destroys product value |
| Evidence-location accuracy | A correct claim with the wrong location is hard to verify |
| Citation validity | Grounding must point to the applicable source |
| Duplicate rate | Repeated comments waste review time |
| Unsupported-claim rate | Measures hallucination risk |
| Reviewer acceptance/edit/dismissal | Captures practical usefulness |
| Time to disposition | Measures workflow value |
| Regression detection rate | Validates revision intelligence |
| Cost and latency per sheet/check | Determines viable pricing and UX |

### Evaluation slices

- raster versus vector PDF;
- drawing discipline;
- project type;
- sheet type;
- jurisdiction;
- dense versus sparse sheets;
- low-quality scans;
- different title-block standards;
- multilingual notes;
- new versus experienced reviewer;
- clean sheets, so false positives are measured.

### Release gates

- No check ships without clean-sheet negative cases.
- Life-safety/compliance-sensitive checks require stricter evidence and sign-off.
- Prompt/model changes run against frozen evaluation suites.
- Organization-specific checks are evaluated separately from global checks.
- Model fallback behavior is tested.
- Invalid structured output always fails visibly.

## Product trust rules

- Never call a result “code compliant” solely from a general-purpose vision model.
- Never convert parsing failure into zero findings.
- Never hide uncertainty behind a single score.
- Never use model confidence as calibrated probability without validation.
- Always allow the reviewer to inspect evidence.
- Always preserve the original machine output and final human decision separately.
- Always show document, model, prompt, check, and source versions.
- Always distinguish advisory review from professional approval.
- Always make deletion and data-retention behavior explicit.

## Data model direction

The current `Project → Drawing → DrawingPage → Analysis → AnalysisIssue` model is a safe foundation. Evolve toward:

```text
Organization
├── Membership
├── StandardLibrary
├── EvaluationSuite
└── Project
    ├── RequirementSource
    ├── DrawingSet
    │   └── Sheet
    │       └── SheetRevision
    ├── Specification
    ├── ProjectEntity
    │   ├── Space
    │   ├── Opening
    │   ├── Assembly
    │   └── DetailReference
    ├── AnalysisRun
    │   ├── CheckExecution
    │   └── Finding
    │       ├── Evidence
    │       ├── HumanDisposition
    │       └── Action
    ├── Decision
    ├── RFI
    ├── Submittal
    ├── RevisionIntent
    ├── Outcome
    └── AuditEvent
```

Avoid storing the important product state only as JSON. JSON is useful for provider artifacts and snapshots; queryable workflow entities need relational identity and history.

## Business model hypotheses

Validate willingness to pay before implementing a complex pricing system.

### Potential entry offer

“Pre-issue drawing-set review and revision verification for small architecture firms.”

### Pricing units to test

- per sheet reviewed;
- per drawing set/revision;
- monthly workspace with included pages;
- paid specialist check packs;
- enterprise organization plan with private standards and integrations.

### Avoid initially

- unlimited AI plans without cost controls;
- pricing only per named user when value and cost are driven by sheets/runs;
- charging for noisy findings;
- opaque credit systems without an estimated run cost.

### Value proof for pilots

Measure:

- reviewer hours before and after;
- accepted findings per set;
- issues fixed before issuance;
- revision-verification time;
- preventable RFIs identified;
- permit comments avoided or resolved faster;
- CA search/coordination time reduced;
- false-positive burden;
- AI cost per useful accepted finding.

## Go-to-market wedge

Do not sell “AI for architecture.” Sell a narrow outcome:

> Planly gives architecture teams a consistent second review of every sheet and proves whether the next revision resolved the accepted findings.

Suggested pilot:

1. Select one active project and one historical project with known RFIs or permit comments.
2. Configure 10–20 firm-specific checks.
3. Run a blinded review against a pre-issue set.
4. Have senior reviewers triage every result.
5. Compare findings with historical outcomes.
6. Measure time, precision, missed high-risk issues, and useful surprises.
7. Decide whether to expand checks, not merely whether the demo looked impressive.

## Customer discovery questions

### Drawing QA/QC

- When does QA actually happen versus when the process says it happens?
- Which checks depend on one senior person’s memory?
- What gets skipped when the deadline moves forward?
- Which coordination failures recur?
- How are redlines tracked to resolution?
- How do you prove a comment was fixed?
- Which false positives would make you stop using a tool?

### Construction administration

- Where do RFIs, submittals, decisions, and meeting commitments live?
- How often is a question already answered somewhere in the documents?
- Which work is routinely absorbed outside fee?
- How do repeated resubmittals affect staffing?
- What record is needed during a dispute?
- What project history disappears when staff change?

### Trust and deployment

- Which documents may be sent to an external model provider?
- What data residency or deletion commitments are required?
- Which findings require licensed sign-off?
- What evidence makes an AI comment credible?
- Which existing system must remain the source of truth?
- Would the firm prefer PDF-first, Revit-connected, or both?

## Product metrics

### North-star candidate

**Professionally accepted risks resolved before issue per active project.**

This measures useful detection plus action, rather than pages processed or AI comments generated.

### Supporting metrics

- weekly active projects;
- sets and revisions reviewed;
- accepted findings per run;
- false-positive/dismissal rate by check;
- median reviewer time per sheet;
- median time from finding to resolution;
- percentage of revisions automatically matched;
- percentage of accepted findings verified fixed;
- preventable-RFI precision;
- organization check reuse;
- retained projects after the first revision cycle;
- AI cost per accepted/resolved finding;
- analysis failure and recovery rate.

## Non-goals for the near term

- Generating permit-ready architectural designs autonomously.
- Replacing Revit, AutoCAD, Bluebeam, Procore, or Autodesk’s common data environment.
- Acting as the authority having jurisdiction.
- Providing legal conclusions.
- Automatically approving submittals or issuing professional certifications.
- Building full project scheduling, accounting, estimating, or field-management suites.
- Supporting every AEC persona before winning the architect/engineer QA loop.

## Recommended next implementation sequence

If development starts immediately, use this order:

1. Organizations, roles, private object storage, and integration tests.
2. `DrawingSet`, `Sheet`, and `SheetRevision` data model.
3. OCR/title-block extraction with human correction and confidence.
4. Sheet/reference graph and missing/duplicate sheet checks.
5. Versioned check framework plus initial deterministic checks.
6. Finding assignment, comments, audit trail, and required dismissal reasons.
7. Revision matching, overlay, and accepted-finding verification.
8. Firm standards ingestion with source-linked checks.
9. Evaluation dashboard and frozen regression suites.
10. Preventable-RFI pilot using historical project outcomes.
11. Decision lineage and searchable project memory.
12. CA fee/scope intelligence pilot.

The first differentiated milestone should be:

> **Planly understands a drawing set, identifies evidence-backed risks, records professional decisions, and verifies those decisions against the next revision.**

That is specific enough to solve a real problem and broad enough to justify the category name Architectural Intelligence.

## Research index

Professional practice and pain points:

- [AIA: Five construction administration risks architects cannot ignore](https://www.aia.org/article/5-construction-administration-risks-architects-cant-ignore)
- [AIA: The future of construction administration](https://www.aia.org/article/future-construction-administration-what-ai-changes-and-what-it-doesnt)
- [AIA construction administration material](https://content.aia.org/sites/default/files/2017-03/EPC_Construction_Admin_3B.pdf)
- [AIA Trust QA/QC checklist](https://theaiatrust.com/wp-content/uploads/2025/10/QA_QC_Checklist_for_Architects_Updated-1-PLS-redline-101425.pdf)
- [NCARB Analysis of Practice](https://www.ncarb.org/sites/default/files/Analysis-of-Practice-Full-Report-2023.pdf)
- [RIBA AI Report 2025](https://www.architecture.com/-/media/GatherContent/Business-Benchmarking/Additional-Documents/RIBA-AI-report-2025-FINALpdf.pdf)
- [Autodesk/FMI Construction Disconnected](https://www.autodesk.com/blogs/construction/construction-disconnected-fmi-report/)
- [Autodesk Data Advantage in Construction](https://construction.autodesk.com/resources/guides/harnessing-data-advantage-in-construction/)

Established workflows:

- [Procore drawing management](https://www.procore.com/en-ca/project-management/drawings)
- [Procore drawing-linked RFIs](https://en-gb.support.procore.com/products/online/user-guide/project-level/drawings/tutorials/create-or-link-rfis-on-a-drawing)
- [Autodesk sheet OCR](https://help.autodesk.com/cloudhelp/ENU/Build-Sheets/files/upload-sheets-and-publish/Review_Edit_Sheet_Numbers_Autodesk_Build.html)
- [Autodesk Compare Sheets](https://help.autodesk.com/cloudhelp/ENU/Build-Sheets/files/Compare_Sheets.html)
- [Bluebeam collaboration](https://www.bluebeam.com/product/collaboration-and-mobility/)
- [UpCodes project/jurisdiction calculator introduction](https://support.up.codes/support/solutions/articles/63000282986-an-introduction)

AI-native and emerging competition:

- [Autodesk Assistant](https://www.autodesk.com/blogs/construction/meet-autodesk-assistant-ai-native-intelligence-in-forma/)
- [Part3 Submittal Assistant](https://www.part3.io/submittal-assistant)
- [Structured AI](https://getstructured.ai/)
- [Nomic drawing review](https://www.nomic.ai/use-cases/automated-drawing-review/ai-drawing-review-software-aec-qa-qc)
- [Lintel](https://www.uselintel.com/)
- [Callout](https://www.callout.app/)
- [ArchiChecker](https://www.archichecker.com/)
- [DrawInspect](https://drawinspect.com/)
- [Deta](https://www.deta.studio/)
- [Clash Nexus AI](https://www.clashnex.ai/)

## Maintenance rule

Update this document whenever one of the following changes:

- target customer or initial wedge;
- product positioning;
- top three roadmap priorities;
- trust or professional-liability assumptions;
- competitor capability that invalidates a differentiation hypothesis;
- core AI architecture or evaluation strategy;
- product metric or pricing hypothesis;
- a pilot produces strong contrary evidence.

Record evidence and the date. Do not silently rewrite product assumptions as facts.
