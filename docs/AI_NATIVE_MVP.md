# Planly AI-Native MVP

Last updated: August 19, 2026

## Product thesis

Planly is not a general PDF chatbot. It is an architectural review workspace that turns a drawing set into traceable project context, finds coordination and documentation risks, lets a professional make the decision, and carries that context into the next revision.

The MVP loop is:

> Upload drawings → extract structured evidence → connect the set → retrieve relevant context → answer or flag risk with citations → review → compare the next revision.

This is enough to demonstrate an AI-native system because AI participates inside a real workflow, while deterministic controls own identity, permissions, versioning, validation, and failure handling.

## User problem

Architectural teams repeatedly spend time locating a note or callout across a set, checking whether references resolve, reconstructing review decisions, and verifying whether a revision actually fixed an issue. The information exists, but it is fragmented across sheets, visual marks, metadata, and people’s memory.

The MVP wedge is pre-issue drawing review for small architectural teams:

- make the set searchable as one project;
- surface broken references and documentation risks with visible evidence;
- answer drawing-set questions without relying on model memory;
- preserve a defensible record of evidence, retrieval, model output, and human disposition;
- show what changed between revisions.

## Implemented AI architecture

```text
PDF drawing set
    ↓
page rendering + versioned vision analysis
    ↓
sheet metadata + references + findings
    ↓
project-scoped evidence chunks in PostgreSQL
    ↓                         ↓
keyword ranking          optional embeddings
    └──────── reciprocal rank fusion ────────┘
                            ↓
bounded context + retrieval trace
                            ↓
structured answer contract
                            ↓
citation validation + insufficient-evidence gate
                            ↓
persisted answer, snapshot, trace, model metadata
                            ↓
human review and revision comparison
```

### Evidence index

Each sheet, reference, and current finding becomes a project-scoped evidence chunk with:

- a stable source ID and evidence type;
- title and normalized retrieval content;
- sheet, page, drawing, confidence, and region metadata;
- a content hash for change detection;
- optional embedding vector, model, and dimensions;
- created and updated timestamps.

Index refresh upserts changed evidence, reuses unchanged vectors, removes stale evidence, and batches embedding requests. Ownership is checked before status, sync, search, or question operations.

### Hybrid retrieval

Planly ranks exact architectural identifiers and semantic intent together:

1. keyword relevance weights titles and exact phrases;
2. cosine similarity ranks embedded evidence;
3. reciprocal rank fusion combines the two ranked lists without pretending their raw scores are comparable;
4. semantic candidates must clear a conservative absolute relevance gate;
5. only a bounded top set reaches the answer model.

Exact identifiers such as `A501` remain strong keyword signals, while questions such as “How can someone enter without using steps?” can retrieve an accessible-route note without exact word overlap. If neither lexical evidence nor a sufficiently similar semantic candidate exists, Planly abstains before calling the answer model. The current threshold is an MVP safety default and must be calibrated on a reviewed real-project dataset before accuracy claims are made.

### Graceful degradation

Embeddings are optional. If semantic indexing is disabled, unsupported by the selected provider, or fails at runtime:

- evidence still persists;
- search and Q&A use lexical retrieval;
- the API returns the fallback reason;
- the UI says `Lexical fallback` instead of claiming hybrid RAG;
- the saved question trace records the mode and reason.

An external AI outage therefore reduces retrieval quality but does not take the evidence workflow down.

### Grounded answer contract

The answer model receives only retrieved project evidence. It must return structured JSON containing an answer, exact evidence IDs, confidence, and an insufficient-evidence flag. The server rejects unknown citations, uncited substantive answers, and contradictory states. Empty retrieval produces a persisted insufficient-evidence answer without an answer-model call. Semantic entailment between every claim and citation is not yet independently verified; that belongs in the real-project evaluation and verifier stage before regulated use.

Project content is treated as untrusted data in the prompt. The model cannot approve compliance or substitute for a licensed professional.

## Why this is AI-native

Atlan describes useful enterprise AI as a context problem: metadata, lineage, quality, and business meaning need to be available to both people and AI. Its current product direction also emphasizes graph and vector retrieval, version history, traces, evaluations, and human certification. Planly applies the same principles to architectural evidence:

- **Context, not chat:** the product builds a reusable project evidence layer before generating an answer.
- **Graph + semantic retrieval:** sheet references preserve explicit relationships; embeddings help with fuzzy intent.
- **Versioned truth:** analyses, evidence, answer snapshots, prompt/model metadata, and revisions are persisted.
- **Observable AI:** users can inspect retrieval mode, candidate counts, top candidates, citations, and fallback reasons.
- **Human-on-the-loop:** AI proposes evidence-backed findings; a professional acknowledges, resolves, dismisses, or reopens them, with an immutable actor/time/rationale history and required dismissal reasons.
- **Evaluable components:** retrieval is tested separately from generation, and deterministic checks remain separate from probabilistic interpretation.

Sources: [Atlan Context Lakehouse](https://atlan.com/context-lakehouse/), [Atlan Context Agents best practices](https://docs.atlan.com/product/capabilities/governance/context-agents-studio/best-practices/enrich-metadata-at-scale), and [Atlan App Framework](https://atlan.com/app-framework/).

## Evaluation contract

Run the deterministic retrieval gate with:

```bash
cd backend
npm run eval:rag
```

The current smoke suite checks:

- semantic retrieval without keyword overlap;
- exact sheet/detail identifiers surviving hybrid fusion;
- lexical fallback without a query vector;
- hard-negative abstention when no evidence clears the relevance gate;
- hit rate at 3 of 100%;
- mean reciprocal rank of at least 0.90.

This is a regression gate, not an accuracy claim. Before a pilot, build a reviewed golden set from real projects with hard negatives and measure:

| Layer | Minimum useful metrics |
| --- | --- |
| Extraction | field accuracy, region accuracy, abstention calibration |
| Retrieval | recall@k, MRR, exact-identifier recall, latency |
| Answering | citation validity, groundedness, insufficient-evidence precision |
| Findings | reviewer acceptance/edit/dismissal, duplicate rate, high-risk recall |
| Product | time to evidence, time to disposition, revision regressions found |
| Operations | provider error rate, fallback rate, cost per project, p95 latency |

Every eval case should record the source revision, expected evidence region, acceptable alternatives, risk class, and reviewer rationale.

## MVP demo script

1. Open a project with an analyzed drawing set and show the extracted sheet index.
2. Open a broken reference overlay and follow its cited page region.
3. Refresh the project context index and explain embedded versus indexed counts.
4. Search an exact identifier such as `A501` to demonstrate deterministic precision.
5. Ask a paraphrased question to demonstrate semantic retrieval.
6. Expand the retrieval trace and show the bounded candidates that reached the model.
7. Ask an unsupported question and show the insufficient-evidence response.
8. Disable `AI_EMBEDDING_ENABLED`, repeat search, and show visible lexical degradation.
9. Run `npm run eval:rag` to show a repeatable quality gate.
10. Compare a revision and show new, resolved, and persisting findings.

The interview narrative should focus on the engineering decisions: context boundaries, provenance, deterministic/probabilistic separation, graceful failure, evaluation, and the scaling path—not merely that an LLM API was called.

## Production boundaries and scaling path

The current design intentionally avoids a vector database. At MVP size, bounded vectors stored as JSON and scored in the API make the retrieval algorithm easy to inspect and deploy. This is not the end-state for large portfolios.

Move to PostgreSQL full-text search plus pgvector/HNSW when projects approach the evidence cap, p95 retrieval latency grows, or multiple instances repeatedly load the same vectors. Keep reciprocal rank fusion and the retrieval contract stable while replacing the storage/query implementation.

Before a paid pilot:

1. index asynchronously after completed analysis instead of only lazy refresh;
2. add organization isolation, invitations, and roles;
3. move private assets to object storage and add deletion/export workflows;
4. create a real-project golden eval set and a reviewer feedback loop;
5. add OCR/text-block and symbol evidence, not only structured analysis outputs;
6. record provider data-retention policy and expose an organization-level semantic-indexing control;
7. add request-level cost/latency telemetry and retrieval-fallback alerts;
8. run browser end-to-end tests for upload → analysis → search → cited answer → review.

## Configuration

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=replace-with-your-openrouter-key
AI_EMBEDDING_ENABLED=true
AI_EMBEDDING_PROVIDER=openrouter
AI_EMBEDDING_MODEL=liquid/lfm-2.5-embedding-350m:free
AI_EMBEDDING_DIMENSIONS=1024
AI_EMBEDDING_INPUT_MAX_CHARS=1600
```

OpenRouter exposes an OpenAI-compatible embeddings endpoint. Planly uses it with float encoding, explicit query/document input types, bounded inputs, batched indexing, and cosine similarity. The default Liquid LFM2.5 embedding model is currently free and produces 1,024-dimensional vectors. Free-model availability and rate limits can change. OpenRouter states that successful requests to this Liquid model may be retained and used for training, so confidential projects must disable semantic indexing unless that data policy is acceptable. See the [OpenRouter embeddings API](https://openrouter.ai/docs/api/api-reference/embeddings/create-embeddings) and [model page](https://openrouter.ai/liquid/lfm-2.5-embedding-350m%3Afree/providers).

Generation and embedding providers are configured independently. If embeddings are disabled or unavailable, Planly automatically uses lexical retrieval and records the fallback reason.

## Definition of MVP done

- A user can register, create a project, upload a valid PDF, and recover from a failed analysis.
- The system extracts correctable sheets, references, findings, and visible evidence locations.
- A user can search and ask across the project with citations and inspect retrieval provenance.
- The system visibly abstains or degrades when evidence or embeddings are unavailable.
- Deterministic checks and revision comparison produce reviewable, repeatable results.
- Reviewers can prioritize findings, follow or copy exact evidence links, record reasoned decisions, inspect immutable review history, and export a CSV review register.
- Tests, schema validation, retrieval evals, lint, and production builds pass.
- Limitations are stated honestly; the UI never represents AI output as professional approval.
