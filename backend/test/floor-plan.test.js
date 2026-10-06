import assert from 'node:assert/strict'
import test from 'node:test'
import { buildFloorPlan, parsePlanPrompt, floorPlanDxf, selectPlanFloor, floorPlanSvg, floorPlanScheduleCsv } from '../../shared/floor-plan.mjs'

const complexPrompt = 'A 2 floor house with 4 bedrooms, 3 bathrooms, a study and parking on an 18 x 24 m plot'

test('feet and metres produce identical model geometry', () => {
  const a = buildFloorPlan(parsePlanPrompt('Two bedrooms, one bathroom on a 30 x 40 ft plot'))
  const b = buildFloorPlan(parsePlanPrompt('2 bedrooms, 1 bathroom on a 9.144 x 12.192 m plot'))
  assert.deepEqual(a.plot, b.plot)
  assert.deepEqual(a.rooms, b.rooms)
})

test('complex prompt preserves total counts and optional spaces', () => {
  const plan = buildFloorPlan(parsePlanPrompt(complexPrompt))
  assert.equal(plan.floors.length, 2)
  assert.equal(plan.rooms.filter(room => room.name.startsWith('Bedroom')).length, 4)
  assert.equal(plan.rooms.filter(room => room.name.startsWith('Bathroom')).length, 3)
  assert.equal(plan.rooms.filter(room => room.name === 'Office').length, 1)
  assert.ok(plan.lines.some(line => line.layer === 'SITE'))
  assert.ok(plan.lines.some(line => line.layer === 'FURNITURE'))
  const stairs = plan.rooms.filter(room => room.name === 'Stairs')
  assert.equal(stairs.length, 2)
  assert.equal(stairs[0].y, stairs[1].y)
  assert.equal(stairs[0].height, stairs[1].height)
  assert.ok(Math.abs(stairs[0].x - stairs[1].x + plan.floors[1].offsetX) < 0.0001)
})

test('ambiguous, unsupported and infeasible requests are rejected', () => {
  for (const prompt of ['A nice home', '30 m x 40 ft house', 'irregular plot 30 x 40 ft', 'basement 30 x 40 ft', 'a multi storey home 18 x 24 m']) assert.throws(() => parsePlanPrompt(prompt))
  for (const prompt of ['7 bedrooms on a 30 x 40 ft plot', '4 bedrooms 2 bathrooms on a 30 x 40 ft plot', 'two bedrooms on a 10 x 10 ft plot', '4 floors on an 18 x 24 m plot']) assert.throws(() => buildFloorPlan(parsePlanPrompt(prompt)))
  assert.throws(() => buildFloorPlan({ plotWidth: Infinity, plotDepth: 20, units: 'm', bedrooms: 2, bathrooms: 1 }))
  assert.equal(parsePlanPrompt('1 bedroom, no parking and no office on a 12 x 18 m plot').parking, false)
})

test('room bounds, disjoint zones, doors and stair alignment hold across supported counts', () => {
  for (let floors = 1; floors <= 3; floors++) for (let bedrooms = 1; bedrooms <= 6; bedrooms++) for (let bathrooms = 1; bathrooms <= 4; bathrooms++) {
    const plan = buildFloorPlan({ plotWidth: 18, plotDepth: 36, units: 'm', bedrooms, bathrooms, floors })
    assert.equal(plan.doors.length, plan.rooms.length + 1)
    assert.equal(new Set(plan.doors.map(door => door.id)).size, plan.rooms.length + 1)
    for (const room of plan.rooms) {
      const floor = plan.floors.find(item => item.id === room.floorId)
      assert.ok(room.x >= floor.offsetX + 1.2 - 0.001 && room.y >= 3)
      assert.ok(room.x + room.width <= floor.offsetX + plan.plot.width - 1.2 + 0.001)
      assert.ok(room.y + room.height <= plan.plot.depth - 1.2 + 0.001)
      assert.ok(room.area > 0 && room.height >= 1.8 - 0.001)
      assert.ok(plan.doors.some(door => door.roomId === room.id && door.floorId === room.floorId))
      for (const other of plan.rooms.filter(item => item.id !== room.id && item.floorId === room.floorId)) {
        const w = Math.min(room.x + room.width, other.x + other.width) - Math.max(room.x, other.x)
        const h = Math.min(room.y + room.height, other.y + other.height) - Math.max(room.y, other.y)
        assert.ok(w <= 0.001 || h <= 0.001)
      }
    }
    if (floors > 1) {
      const stairs = plan.rooms.filter(room => room.name === 'Stairs')
      assert.ok(stairs.every(room => room.y === stairs[0].y && room.height === stairs[0].height))
    }
    assert.ok(plan.lines.every(line => [line.x1, line.y1, line.x2, line.y2].every(Number.isFinite)))
  }
})

test('single-floor exports return to local origin and omit other floors', () => {
  const plan = buildFloorPlan(parsePlanPrompt(complexPrompt))
  const upper = selectPlanFloor(plan, 'floor-2')
  assert.equal(upper.floors.length, 1)
  assert.ok(upper.lines.every(line => line.floorId === 'floor-2'))
  assert.ok(upper.rooms.every(room => room.x < plan.plot.width))
  assert.ok(upper.labels.every(item => !item.text.includes('GROUND FLOOR')))
  assert.throws(() => selectPlanFloor(plan, 'unknown'))
})

test('DXF versions and scaled coordinates use explicit modern unit metadata', () => {
  const plan = buildFloorPlan(parsePlanPrompt(complexPrompt))
  const r12 = floorPlanDxf(plan)
  const modern = floorPlanDxf(plan, { version: 'R2000', units: 'mm' })
  assert.ok(r12.includes('AC1009') && modern.includes('AC1015'))
  assert.ok(modern.includes('$INSUNITS\n70\n4\n'))
  assert.ok(modern.includes('AcDbLine'))
  assert.ok(modern.includes('CONCEPT ONLY - UNITS: MM'))
  assert.equal(r12.split('0\nLINE\n').length - 1, plan.lines.length + 4)
  assert.equal(modern.split('0\nTEXT\n').length - 1, plan.labels.length)
  assert.ok(floorPlanDxf(plan, { version: 'R2000', units: 'm' }).includes('$INSUNITS\n70\n6\n'))
  assert.throws(() => floorPlanDxf(plan, { version: 'DWG' }))
  assert.ok(modern.endsWith('0\nEOF\n'))
})

test('SVG escapes content and schedules match model door identities', () => {
  const plan = buildFloorPlan(parsePlanPrompt(complexPrompt))
  const svg = floorPlanSvg({ ...plan, labels: [{ x: 0, y: 0, height: 1, text: '<script>&"' }] })
  assert.ok(svg.includes('&lt;script&gt;&amp;&quot;'))
  assert.ok(!svg.includes('<script>'))
  const csv = floorPlanScheduleCsv(plan)
  assert.equal(csv.trim().split('\r\n').length, plan.doors.length + 1)
  for (const door of plan.doors) assert.ok(csv.includes(`"${door.id}"`))
})
