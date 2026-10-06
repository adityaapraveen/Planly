import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { buildFloorPlan, parsePlanPrompt, floorPlanDxf, selectPlanFloor, floorPlanSvg, floorPlanScheduleCsv } from '../shared/floor-plan.mjs'

const prompt = process.argv.slice(2).join(' ') || 'A single-floor 2 bedroom house with 1 bathroom on a 30 x 40 ft plot.'
try {
  const plan = buildFloorPlan(parsePlanPrompt(prompt))
  const directory = new URL('../demo-output/', import.meta.url)
  await mkdir(directory, { recursive: true })
  await writeFile(new URL('planly-concept-metres.dxf', directory), floorPlanDxf(plan))
  await writeFile(new URL('planly-concept.json', directory), JSON.stringify({ prompt, ...plan }, null, 2))
  await writeFile(new URL('planly-concept-R2000-mm.dxf', directory), floorPlanDxf(plan, { version: 'R2000', units: 'mm' }))
  await writeFile(new URL('planly-concept.svg', directory), floorPlanSvg(plan))
  await writeFile(new URL('planly-door-schedule.csv', directory), floorPlanScheduleCsv(plan))
  for (const floor of plan.floors) {
    await writeFile(new URL(`planly-${floor.id}-R2000-mm.dxf`, directory), floorPlanDxf(selectPlanFloor(plan, floor.id), { version: 'R2000', units: 'mm' }))
  }
  console.log(`Generated ${plan.rooms.length} room zones. R12 uses metres; R2000 files use millimetres.\n${fileURLToPath(directory)}\nConcept only; not construction documentation.`)
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
