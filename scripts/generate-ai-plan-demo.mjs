// Run from backend/ so its dotenv configuration loads; never prints provider keys.
import { mkdir, writeFile } from 'node:fs/promises'
import { generateAIPlan } from '../backend/src/services/ai-plan.service.js'
import { generateAIResponse, getAIProviderMetadata } from '../backend/src/services/ai/ai.service.js'
import { parsePlanPrompt, floorPlanDxf, floorPlanSvg, selectPlanFloor } from '../shared/floor-plan.mjs'

const prompt = process.argv.slice(2).join(' ') || 'A 2 floor house with 4 bedrooms, 3 bathrooms, a study and parking on an 18 x 24 m plot. Put living and dining toward the rear for privacy, and keep the study near the front.'
try {
  const result = await generateAIPlan({ requirements: parsePlanPrompt(prompt), prompt, generate: generateAIResponse })
  const directory = new URL('../demo-output/', import.meta.url)
  await mkdir(directory, { recursive: true })
  await writeFile(new URL('planly-ai-layout.json', directory), JSON.stringify({ prompt, ...result, ...getAIProviderMetadata() }, null, 2))
  await writeFile(new URL('planly-ai-layout-R2000-mm.dxf', directory), floorPlanDxf(result.plan, { version: 'R2000', units: 'mm' }))
  await writeFile(new URL('planly-ai-layout.svg', directory), floorPlanSvg(result.plan))
  for (const floor of result.plan.floors) {
    await writeFile(new URL(`planly-ai-${floor.id}-R2000-mm.dxf`, directory), floorPlanDxf(selectPlanFloor(result.plan, floor.id), { version: 'R2000', units: 'mm' }))
  }
  console.log(JSON.stringify({ provider: getAIProviderMetadata(), validation: result.layoutValidation, rooms: result.plan.rooms.map(({name,floorId,x,y,width,height}) => ({name,floorId,x,y,width,height})) }, null, 2))
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
