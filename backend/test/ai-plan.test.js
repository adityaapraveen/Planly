import test from 'node:test'
import assert from 'node:assert/strict'
import { buildFloorPlan, validateAIPlacement } from '../../shared/floor-plan.mjs'
import { generateAIPlan } from '../src/services/ai-plan.service.js'

const requirements = { plotWidth: 18, plotDepth: 24, units: 'm', bedrooms: 4, bathrooms: 3, floors: 2, office: true, parking: true }
const base = buildFloorPlan(requirements)
function proposed() {
  const rooms = []
  for (const floor of base.floors) for (const side of [0, 1]) {
    let y = base.building.y
    for (const room of base.rooms.filter(room => room.floorId === floor.id && room.side === side).reverse()) {
      rooms.push({ id: room.id, side, y, height: room.height })
      y += room.height
    }
  }
  return { leftWidth: 6, rooms, designNotes: ['Move living space toward the rear.'] }
}

test('AI proposal changes coordinates and corridor width while retaining valid geometry', async () => {
  const placement = proposed()
  assert.deepEqual(validateAIPlacement(base, placement), [])
  const result = await generateAIPlan({ requirements, prompt: 'Living at rear', generate: async () => JSON.stringify(placement) })
  assert.equal(result.layoutValidation.attempts, 1)
  assert.equal(result.plan.version, 'ai-corridor-layout-v1')
  assert.equal(result.plan.rooms.find(room => room.name === 'Living').width, 6)
  assert.notEqual(result.plan.rooms.find(room => room.name === 'Living').y, base.rooms.find(room => room.name === 'Living').y)
  assert.equal(result.plan.rooms.filter(room => room.name === 'Stairs')[0].y, result.plan.rooms.filter(room => room.name === 'Stairs')[1].y)
  assert.equal(base.rooms.find(room => room.name === 'Living').width, 7.2)
})

test('overlap feedback is sent for correction rather than falling back to the local plan', async () => {
  const valid = proposed(), invalid = structuredClone(valid)
  invalid.rooms[0].y += 1
  let calls = 0
  const result = await generateAIPlan({ requirements, prompt: 'A home', generate: async ({ userPrompt }) => {
    calls++
    if (calls === 2) {
      const feedback = JSON.parse(userPrompt)
      assert.ok(feedback.correctionErrors.some(error => /gap or overlap/.test(error)))
      assert.deepEqual(feedback.previousProposal, invalid)
    }
    return JSON.stringify(calls === 1 ? invalid : valid)
  } })
  assert.equal(result.layoutValidation.corrected, true)
  assert.equal(calls, 2)
})

test('invalid schema and repeated invalid geometry stop after three proposals', async () => {
  let calls = 0
  await assert.rejects(generateAIPlan({ requirements, prompt: 'A home', generate: async () => { calls++; return '{"code":"run this"}' } }), /after 3 attempts/)
  assert.equal(calls, 3)
})

test('validator rejects missing/duplicate rooms, bad bounds, narrow columns and misaligned stairs', () => {
  const placement = proposed()
  placement.leftWidth = 1
  placement.rooms[0].y = -1
  const stair = base.rooms.filter(room => room.name === 'Stairs')[1]
  placement.rooms.find(room => room.id === stair.id).height += 0.2
  placement.rooms.pop()
  placement.rooms.push({ ...placement.rooms[0] })
  const errors = validateAIPlacement(base, placement)
  assert.ok(errors.some(error => /column/.test(error)))
  assert.ok(errors.some(error => /bounds/.test(error)))
  assert.ok(errors.some(error => /duplicate/.test(error)))
  assert.ok(errors.some(error => /Missing room/.test(error)))
  const stairPlacement = proposed()
  stairPlacement.rooms.find(room => room.id === stair.id).height += 0.2
  assert.ok(validateAIPlacement(base, stairPlacement).some(error => /Stair/.test(error)))
  assert.throws(() => buildFloorPlan(requirements, placement), /column/)
})

test('provider failures surface without silent local output', async () => {
  await assert.rejects(generateAIPlan({ requirements, prompt: 'A home', generate: async () => { throw new Error('Provider unavailable') } }), error => error.statusCode === 502 && /provider is unavailable/.test(error.message))
})
