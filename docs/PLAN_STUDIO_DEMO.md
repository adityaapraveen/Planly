# Prompt-to-CAD demo

Plan Studio generates editable **2D concept drawings for rectangular homes with 1–3 floors**. It is a deterministic corridor template, not an architectural optimizer or construction-document generator.

## Try it

Run `npm run dev` in `client`, then open `/plan-studio-demo`. This public local mode needs no account, database or AI provider. The authenticated workspace also has `/plan-studio`.

Use this prompt:

> A 2 floor house with 4 bedrooms, 3 bathrooms, a study and parking on an 18 x 24 m plot.

Click **Generate concept**, choose **Ground floor** or **Level 1**, inspect a room, then download **DXF**. The selected floor controls DXF, SVG and CSV exports; JSON retains the entire model. Editing the prompt disables export until regeneration.

Supported inputs: explicit plot dimensions in feet or metres; total 1–6 bedrooms and 1–4 bathrooms; 1–3 floors; study/office, utility/laundry and parking. Width must be 8–40 m and depth 10–60 m. Unsupported shapes and infeasible fits fail with an error. Other preferences, including entrance orientation and individual room sizes, are not implemented.

Added geometry includes 150 mm schematic walls, window openings, 900 mm room-door openings and swing linework, aligned stair reservations, furniture symbols, a parking bay, floor labels and a door schedule. Template depths vary by room type; column widths are shared. Flexible-space zones disclose surplus footprint. Room areas exclude schematic wall faces; room inspector dimensions describe the gross zone.

## Open the actual files in LibreCAD

LibreCAD is installed on this computer. Use **File → Open** and choose `demo-output/planly-floor-1-R2000-mm.dxf`, then **Auto Zoom**. Set drawing units to millimetres if asked. Open `planly-floor-2-R2000-mm.dxf` for the upper floor, or `planly-concept-R2000-mm.dxf` for both floors side by side. A room door is 900 drawing units in these exports.

The alternative `planly-concept-metres.dxf` uses R12 and metres: a room door is 0.9 drawing units. R12 depends on manually selecting the matching units. R2000 includes insertion-unit metadata. Do not switch a metres file to millimetres without scaling its geometry.

Actual LibreCAD-rendered previews are included as `demo-output/planly-floor-1-R2000-mm.pdf` and `demo-output/librecad-ground-floor.png`. These were produced by LibreCAD's [official dxf2pdf console tool](https://docs.librecad.org/en/2.2.0_a/guides/console-tool.html), not a simulated CAD screenshot.

## Compatibility scope

The exporter deliberately uses ASCII DXF LINE and TEXT entities, editable layers and conservative R12/R2000 versions. Dimensions are line/text annotations, not associative dimension entities. The default is R2000 with millimetres.

- **LibreCAD:** both versions and the individual-floor files were imported and rendered successfully on this computer.
- **AutoCAD:** Autodesk documents [DXF import](https://help.autodesk.com/cloudhelp/2022/ENU/AutoCAD-Core/files/GUID-98DB6853-71EE-4E10-A8C3-9BD21A2A6143.htm). These files have not been opened in AutoCAD here.
- **Rhino:** documented [DWG/DXF import](https://docs.mcneel.com/rhino/8/help/en-us/fileio/autocad_dwg_dxf_import_export.htm). Not runtime tested here.
- **BricsCAD:** documented [DXF opening](https://helpcenter.bricsys.com/en-us/document/command-reference/o/open-command?version=V25). Not runtime tested here.
- **FreeCAD:** documented [2D DXF import/export](https://github.com/FreeCAD/FreeCAD-documentation/blob/main/wiki/Manual_Import_and_export_to_other_filetypes.md). Not runtime tested here; importer settings can affect results.
- **Revit:** documented [CAD import and unit selection](https://help.autodesk.com/cloudhelp/2020/ENU/Revit-Model/files/GUID-E8705303-0610-4A82-9118-0C3A742706D2.htm). Import creates CAD linework, not native BIM walls.
- **Archicad:** documented [DXF/DWG interoperability](https://help.graphisoft.com/AC/22/INT/_AC22_Help/110_Interoperability/110_Interoperability-23.htm). Translator settings matter; no native BIM conversion is supplied.

Universal support across every major software/version is not certified. No native DWG, RVT, IFC, structural model or 3D building is generated. Validate import units, layers, text and geometry in each target/version before using that software in a production workflow.

## Reproduce generation and validation

From the repository root:

```sh
node scripts/generate-plan-demo.mjs 'A 2 floor house with 4 bedrooms, 3 bathrooms, a study and parking on an 18 x 24 m plot'
python -m venv /tmp/planly-cad-validation
/tmp/planly-cad-validation/bin/pip install ezdxf==1.4.4
/tmp/planly-cad-validation/bin/python scripts/validate-cad.py --render
pdftoppm -scale-to 1800 -png -singlefile demo-output/planly-floor-1-R2000-mm.pdf demo-output/librecad-ground-floor
```

The generation script replaces current example outputs. The validator independently checks all LINE coordinates and layers against the source model, TEXT counts, unit/version metadata, audit errors, repairs and read/write/read roundtrips. `--render` also runs LibreCAD and checks its PDF output. Results are saved in `demo-output/cad-validation.json`.

Validation on 2026-10-06: all four example files passed ezdxf 1.4.4 auditing with zero errors/repairs, source-coordinate checks and roundtrips, and rendered successfully in LibreCAD. Backend tests, client lint and production build passed. Browser checks verified the complex prompt, floor filtering and room inspection. The in-app browser did not expose a completed download event, so browser download completion remains unverified; the independently generated downloadable files above are validated. The configured OpenRouter provider was subsequently verified with the exact Plan Studio prompt: its response passed the strict requirements schema and generated a two-floor model. The full authenticated browser request remains unverified.

## Architecture and limits

`shared/floor-plan.mjs` separates prompt interpretation, deterministic geometry, floor selection and exports. `client/src/pages/PlanStudio.jsx` previews the same model. `backend/src/routes/plan.routes.js` optionally asks the configured provider for requirements only, validates them with a strict schema, and asks the provider for room placements. Valid placements are passed to the shared geometry builder. The endpoint uses existing authentication and rate limiting; no provider-generated code executes. No provider key goes to the client. Plans are ephemeral and downloadable rather than persisted revisions.

Assumed setbacks, room widths, stair geometry and furnishings are schematic. Checks do not establish circulation around furniture, egress, accessibility, daylight, local regulations, structural safety or MEP feasibility. Before production use, replace the fixed corridor template with area/adjacency constraints and circulation validation, add verified stair rise/run and exit rules, and introduce jurisdiction-specific rules plus architect review. CAD readability and architectural accuracy are separate acceptance criteria.

## Use real AI mode

Start the backend with `npm start` in `backend` and the client with `npm run dev` in `client`. Use `http://localhost:5173` to match the configured backend CORS origin. Sign in, open `/plan-studio`, and choose **AI layout — validated geometry** (the workspace default). The public demo now displays this option too, with sign-in guidance. Authentication is still required for AI generation.

The existing backend `.env` selects `AI_PROVIDER`, the matching `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` or `OPENAI_API_KEY` / `OPENAI_MODEL`. Keep these values on the backend and restart it after changes. AI now interprets requirements, then separately proposes room sides, order, depths and corridor position. The geometry validator checks the proposal and sends failures back for up to two correction attempts. The topology remains constrained to a rectangular envelope with a full-depth corridor; floors and room identities are allocated before the AI layout step.

## AI arrangement implementation

`backend/src/services/ai-plan.service.js` owns the proposal/correction lifecycle. The model receives the brief, envelope and required room IDs with assigned floors. It chooses corridor split, room side, vertical position and depth. `validateAIPlacement` in `shared/floor-plan.mjs` verifies identities, bounds, column widths, minimum depths, habitable-room aspect ratios, complete column tiling and aligned stairs. A strict schema permits numeric data only. The full-depth corridor provides a connected circulation route with room openings; furniture clearance and accessibility are not validated.

There are at most three design proposals, in addition to one requirements call. Validation failures include actionable feedback and the previous proposal. Exhaustion returns an error; no local template is substituted. Provider failures also surface as errors. Each request consumes provider quota and may take longer when correction is needed. The response includes validation attempt count, which the UI displays. Provider keys remain on the backend and authentication/rate limiting remain required.

To generate an AI-arranged example without changing existing template samples, run `node ../scripts/generate-ai-plan-demo.mjs` from `backend/`. This script uses the local parser for the example requirements and the real provider for room arrangement. It writes `demo-output/planly-ai-layout.json`, `planly-ai-layout-R2000-mm.dxf` and `planly-ai-layout.svg`. The signed-in API flow uses the provider for both interpretation and arrangement.

AI-arrangement verification on 2026-10-06: the configured OpenRouter model produced a valid placement on the first proposal for the two-floor example. The study moved to the front, living/dining to the rear, and the corridor split changed to 6 m / 8.4 m room columns. All three AI DXFs passed independent coordinate/layer checks, zero-error/zero-repair audits and roundtrips, and were imported/rendered by LibreCAD. Use `python scripts/validate-cad.py --ai --render` in the validation environment to reproduce CAD checks. The correction loop was tested with simulated invalid proposals; live authenticated browser generation still requires signing in.
