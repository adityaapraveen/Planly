// Geometry and CAD exchange are deterministic. One model unit is one metre.
const round = value => Math.round(value * 10000) / 10000
const words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 }
const countPattern = Object.keys(words).join('|') + '|\\d+'
const layers = { '0': 7, PLOT: 8, WALLS: 7, DOORS: 3, WINDOWS: 4, LABELS: 7, DIMENSIONS: 2, FURNITURE: 8, STAIRS: 6, SITE: 3, SCHEDULE: 7, FRAME: 8 }

export function parsePlanPrompt(prompt) {
  if (typeof prompt !== 'string' || prompt.trim().length < 8 || prompt.length > 2000) throw new Error('Describe your plot dimensions and rooms in 8–2,000 characters.')
  if (/-\s*\d/.test(prompt)) throw new Error('Plot dimensions and room counts must be positive.')
  const text = prompt.toLowerCase().replace(/[–-]/g, ' ')
  if (/\b(triangular|irregular|l shaped|office building|hospital|apartment block|basement|duplex)\b/.test(text)) throw new Error('Use a rectangular home plot. Irregular plots, duplexes and commercial buildings are not supported.')
  const dimensions = text.match(/(?<![\d.])(\d+(?:\.\d+)?)\s*(ft|feet|metres|meters|m)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(ft|feet|metres|meters|m)\b/)
  if (!dimensions) throw new Error('Include plot dimensions and units, for example 30 x 40 ft or 18 x 24 m.')
  const count = (noun, fallback) => {
    const match = text.match(new RegExp(`\\b(${countPattern})\\s*(?:${noun})\\b`))
    return match ? (words[match[1]] ?? Number(match[1])) : fallback
  }
  const units = ['ft', 'feet'].includes(dimensions[4]) ? 'ft' : 'm'
  if (dimensions[2] && (['ft', 'feet'].includes(dimensions[2]) ? 'ft' : 'm') !== units) throw new Error('Use the same units for both plot dimensions.')
  const floors = /\b(single|ground)\s*(floor|storey|story)\b/.test(text) ? 1 : count('floors?|storeys?|stor(?:y|ies)', 1)
  if (/multi\s*(storey|story|floor)/.test(text) && floors === 1) throw new Error('Specify the floor count, for example 2 floors.')
  const parking = /\b(parking|carport)\b/.test(text) && !/\b(no|without)\s+(?:car\s+)?parking\b/.test(text)
  const office = /\b(office|study)\b/.test(text) && !/\b(no|without)\s+(office|study)\b/.test(text)
  const utility = /\b(utility|laundry)\b/.test(text) && !/\b(no|without)\s+(utility|laundry)\b/.test(text)
  return {
    plotWidth: Number(dimensions[1]), plotDepth: Number(dimensions[3]), units,
    bedrooms: count('bedrooms?|bhk', 2), bathrooms: count('bathrooms?|baths?', 1), floors, parking, office, utility,
    notes: ['Local mode reads dimensions, total room counts, 1–3 floors, study/office, utility/laundry and parking.',
      'Defaults: 2 bedrooms, 1 bathroom, 1 floor. Other preferences, including entrance orientation and individual room dimensions, are not applied.']
  }
}

const minDepth = name => /^Bathroom|Utility/.test(name) ? 1.8 : /^Stair/.test(name) ? 3.2 : /^Bedroom|Lounge/.test(name) ? 2.7 : /^Living/.test(name) ? 2.8 : 2.4
const targetDepth = name => /^Bedroom/.test(name) ? 4.5 : /^Living|Lounge/.test(name) ? 5 : 4

export function buildFloorPlan(input, placement = null) {
  if (placement) {
    const errors = validateAIPlacement(buildFloorPlan(input), placement)
    if (errors.length) throw new Error(errors.join('; '))
  }
  if (!input || !['m', 'ft'].includes(input.units)) throw new Error('Units must be m or ft.')
  const factor = input.units === 'ft' ? 0.3048 : 1
  const width = Number(input.plotWidth) * factor, depth = Number(input.plotDepth) * factor
  const bedrooms = Number(input.bedrooms), bathrooms = Number(input.bathrooms), floorCount = Number(input.floors ?? 1)
  if (!Number.isFinite(width) || !Number.isFinite(depth) || width < 8 || width > 40 || depth < 10 || depth > 60) throw new Error('Use a plot 8–40 m wide and 10–60 m deep, with explicit units.')
  if (!Number.isInteger(bedrooms) || bedrooms < 1 || bedrooms > 6 || !Number.isInteger(bathrooms) || bathrooms < 1 || bathrooms > 4 || !Number.isInteger(floorCount) || floorCount < 1 || floorCount > 3) throw new Error('Supported range: 1–6 bedrooms, 1–4 bathrooms, and 1–3 floors.')
  const parking = input.parking === true, office = input.office === true, utility = input.utility === true
  const front = parking ? 6 : 3
  const building = { x: 1.2, y: front, width: width - 2.4, height: depth - front - 1.2 }
  const corridorWidth = 1.2, wallThickness = 0.15, roomWidth = placement?.leftWidth ?? (building.width - corridorWidth) / 2
  const rightWidth = building.width - corridorWidth - roomWidth
  if (roomWidth < 2.7 || rightWidth < 2.7) throw new Error('The plot is too narrow for the corridor layout. Use a wider plot.')
  const lines = [], labels = [], rooms = [], floors = [], doors = []
  let activeFloor = null
  const line = (layer, x1, y1, x2, y2) => lines.push({ layer, floorId: activeFloor, x1: round(x1), y1: round(y1), x2: round(x2), y2: round(y2) })
  const label = (x, y, text, height = 0.2, layer = 'LABELS') => labels.push({ x: round(x), y: round(y), text, height, layer, floorId: activeFloor })
  const rect = (layer, x, y, w, h) => {
    line(layer, x, y, x + w, y); line(layer, x + w, y, x + w, y + h)
    line(layer, x + w, y + h, x, y + h); line(layer, x, y + h, x, y)
  }
  const distributed = (total, floorIndex) => Math.floor(total / floorCount) + (floorIndex < total % floorCount ? 1 : 0)
  let bedroomNumber = 0, bathroomNumber = 0
  for (let floorIndex = 0; floorIndex < floorCount; floorIndex++) {
    const id = `floor-${floorIndex + 1}`, offsetX = floorIndex * (width + 4)
    activeFloor = id
    const floor = { id, name: floorIndex === 0 ? 'Ground floor' : `Level ${floorIndex}`, offsetX, plot: { width: round(width), depth: round(depth) }, building: { ...building, x: building.x + offsetX } }
    floors.push(floor)
    const names = floorIndex === 0 ? ['Living', 'Kitchen', 'Dining'] : ['Lounge']
    for (let i = 0; i < distributed(bedrooms, floorIndex); i++) names.push(`Bedroom ${++bedroomNumber}`)
    for (let i = 0; i < distributed(bathrooms, floorIndex); i++) names.push(`Bathroom ${++bathroomNumber}`)
    if (floorIndex === 0 && office) names.push('Office')
    if (floorIndex === 0 && utility) names.push('Utility')
    const columns = [[], floorCount > 1 ? ['Stairs'] : []]
    names.forEach(name => columns[columns[0].length <= columns[1].length ? 0 : 1].push(name))
    if (!columns[1].length) columns[1].push('Utility')
    for (const column of columns) {
      if (column.every(name => /^Bathroom|Stairs|Utility/.test(name))) column.push('Storage')
    }
    for (let side = 0; side < 2; side++) {
      const column = columns[side], minimum = column.reduce((sum, name) => sum + minDepth(name), 0)
      if (minimum > building.height + 0.00001) throw new Error(`The requested rooms do not fit ${floor.name}. Enlarge the plot or reduce rooms/extras.`)
      const growable = column.filter(name => !/^Bathroom|Stairs|Utility/.test(name)).length
      let y = building.y
      for (const name of column) {
        const fixed = /^Bathroom|Stairs|Utility/.test(name)
        const h = fixed ? minDepth(name) : Math.min(targetDepth(name), minDepth(name) + (building.height - minimum) / growable)
        const x = offsetX + building.x + (side ? roomWidth + corridorWidth : 0)
        const zoneWidth = side === 0 ? roomWidth : rightWidth
        rooms.push({ id: `${id}-room-${rooms.length + 1}`, floorId: id, name, side, x: round(x), y: round(y), width: round(zoneWidth), height: round(h), area: round((zoneWidth - wallThickness) * (h - wallThickness)) })
        y += h
      }
      const remaining = building.y + building.height - y
      if (remaining > 0.00001) {
        if (remaining >= 1.8) {
          rooms.push({ id: `${id}-room-${rooms.length + 1}`, floorId: id, name: 'Flexible space', side,
            x: round(offsetX + building.x + (side ? roomWidth + corridorWidth : 0)), y: round(y), width: round(side === 0 ? roomWidth : rightWidth), height: round(remaining), area: round(((side === 0 ? roomWidth : rightWidth) - wallThickness) * (remaining - wallThickness)) })
        } else {
          // Keep narrow leftover strips out of the plan by extending the final zone.
          const last = rooms[rooms.length - 1]
          last.height = round(last.height + remaining)
          last.area = round((last.width - wallThickness) * (last.height - wallThickness))
        }
      }
    }
    if (placement) {
      for (const room of rooms.filter(item => item.floorId === id)) {
        const proposed = placement.rooms.find(item => item.id === room.id)
        if (!proposed) throw new Error(`Missing placement for ${room.id}`)
        room.side = proposed.side
        room.x = round(offsetX + building.x + (proposed.side ? roomWidth + corridorWidth : 0))
        room.y = round(proposed.y)
        room.width = round(proposed.side ? rightWidth : roomWidth)
        room.height = round(proposed.height)
        room.area = round((room.width - wallThickness) * (room.height - wallThickness))
      }
    }
    rect('PLOT', offsetX, 0, width, depth)
    label(offsetX + 0.4, depth + 1.8, floor.name.toUpperCase(), 0.3)
    label(offsetX + 0.4, 0.65, 'CONCEPT ONLY - METRES - REVIEW REQUIRED', 0.18)
    label(offsetX + 0.4, 1.2, `FRONT / SOUTH - ${front} m assumed front zone`, 0.18)
    const corridorX = offsetX + building.x + roomWidth
    line('WALLS', corridorX, building.y + building.height, corridorX + corridorWidth, building.y + building.height)
    if (floorIndex === 0) {
      line('WALLS', corridorX, building.y, corridorX + 0.15, building.y)
      line('WALLS', corridorX + 1.05, building.y, corridorX + corridorWidth, building.y)
      line('DOORS', corridorX + 0.15, building.y, corridorX + 0.15, building.y + 0.9)
      label(corridorX + 0.1, building.y + 0.2, 'ENTRY E01', 0.1)
      doors.push({ id: 'E01', floorId: id, roomId: null, room: 'Main entry', width: 0.9 })
    } else {
      line('WALLS', corridorX, building.y, corridorX + corridorWidth, building.y)
      label(corridorX + 0.1, building.y + 0.2, 'CORRIDOR', 0.1)
    }
    line('DIMENSIONS', offsetX, depth + 0.65, offsetX + width, depth + 0.65)
    label(offsetX + width / 2 - 0.5, depth + 0.85, `${width.toFixed(2)} m`, 0.2)
    line('DIMENSIONS', offsetX + width + 0.55, 0, offsetX + width + 0.55, depth)
    label(offsetX + width + 0.7, depth / 2, `${depth.toFixed(2)} m`, 0.18)
    if (parking && floorIndex === 0) {
      rect('SITE', offsetX + width - 3.8, 0.4, 2.5, 5)
      rect('FURNITURE', offsetX + width - 3.55, 0.9, 2, 4)
      label(offsetX + width - 3.6, 5.6, 'PARKING', 0.18)
    }
  }
  for (const [roomIndex, room] of rooms.entries()) {
    activeFloor = room.floorId
    const { x, y, width: w, height: h, side, name } = room
    const innerX = side === 0 ? x + w : x, outerX = side === 0 ? x : x + w
    const doorY = y + h / 2 - 0.45, windowY = y + h / 2 - 0.6
    for (const offset of [-wallThickness / 2, wallThickness / 2]) {
      line('WALLS', x, y + offset, x + w, y + offset)
      line('WALLS', x, y + h + offset, x + w, y + h + offset)
      line('WALLS', outerX + offset, y, outerX + offset, windowY)
      line('WALLS', outerX + offset, windowY + 1.2, outerX + offset, y + h)
      line('WALLS', innerX + offset, y, innerX + offset, doorY)
      line('WALLS', innerX + offset, doorY + 0.9, innerX + offset, y + h)
    }
    for (const offset of [-0.04, 0.04]) line('WINDOWS', outerX + offset, windowY, outerX + offset, windowY + 1.2)
    const sign = side === 0 ? -1 : 1
    line('DOORS', innerX, doorY, innerX + sign * 0.9, doorY)
    for (let step = 0; step < 12; step++) {
      const a = step * Math.PI / 24, b = (step + 1) * Math.PI / 24
      line('DOORS', innerX + sign * 0.9 * Math.cos(a), doorY + 0.9 * Math.sin(a), innerX + sign * 0.9 * Math.cos(b), doorY + 0.9 * Math.sin(b))
    }
    const doorId = `D${String(roomIndex + 1).padStart(2, '0')}`
    doors.push({ id: doorId, floorId: room.floorId, roomId: room.id, room: name, width: 0.9 })
    label(innerX + (side ? 0.2 : -0.7), doorY + 1.02, doorId, 0.12)
    const sizeText = `${(w - wallThickness).toFixed(2)} x ${(h - wallThickness).toFixed(2)} m`
    const textX = (text, size) => side === 0 ? x + 0.25 : x + w - 0.25 - text.length * size * 0.65
    label(textX(name, 0.18), y + 0.45, name, 0.18)
    label(textX(sizeText, 0.13), y + 0.18, sizeText, 0.13)
    if (/Bedroom/.test(name)) {
      const bedX = side === 0 ? x + 0.25 : x + w - 1.75
      rect('FURNITURE', bedX, y + h - 2.05, 1.5, 1.8)
      rect('FURNITURE', bedX + 0.1, y + h - 0.7, 1.3, 0.35)
    } else if (/Living|Lounge/.test(name)) {
      rect('FURNITURE', side === 0 ? x + 0.35 : x + w - 2.25, y + h - 1.15, 1.9, 0.75)
      rect('FURNITURE', side === 0 ? x + 0.7 : x + w - 1.9, y + h - 2, 1.2, 0.55)
    } else if (/Kitchen/.test(name)) {
      rect('FURNITURE', side === 0 ? x + 0.25 : x + w - 0.85, y + 1, 0.6, h - 1.3)
      rect('FURNITURE', side === 0 ? x + 0.3 : x + w - 0.8, y + h - 0.9, 0.5, 0.4)
    } else if (/Bathroom|Utility/.test(name)) {
      rect('FURNITURE', side === 0 ? x + 0.25 : x + w - 0.8, y + h - 0.85, 0.55, 0.6)
      rect('FURNITURE', x + w / 2 - 0.4, y + h - 1, 0.8, 0.75)
    } else if (/Dining|Office/.test(name)) {
      rect('FURNITURE', side === 0 ? x + 0.45 : x + w - 1.95, y + h - 1.6, 1.5, 0.8)
    } else if (name === 'Stairs') {
      // An aligned U-shaped stair reservation, not a checked riser/tread design.
      const stairX = side === 0 ? x + 0.25 : x + w - 2.45
      rect('STAIRS', stairX, y + 0.9, 2.2, 2)
      for (let step = 0; step <= 7; step++) {
        const treadY = y + 0.9 + step * 0.22
        line('STAIRS', stairX, treadY, stairX + 0.95, treadY)
        line('STAIRS', stairX + 1.25, treadY, stairX + 2.2, treadY)
      }
    }
  }
  const uniqueLines = [...new Map(lines.map(item => {
    const endpoints = [`${item.x1},${item.y1}`, `${item.x2},${item.y2}`].sort()
    return [`${item.floorId}:${item.layer}:${endpoints.join(':')}`, item]
  })).values()]
  const bounds = { x: -0.7, y: -0.4, width: floorCount * (width + 4), height: depth + 3 }
  return {
    version: 'concept-zoned-v2', units: 'm', plot: { width: round(width), depth: round(depth) }, building,
    requirements: { bedrooms, bathrooms, floors: floorCount, parking, office, utility }, floors, rooms, doors, lines: uniqueLines, labels, bounds,
    assumptions: [`${floorCount} floor(s); rectangular plot; south/front entrance. Room counts are totals across floors.`,
      `Assumed front zone ${front} m; sides/rear 1.2 m. These are not local regulations.`,
      '1.2 m corridor; 0.9 m room door openings; 0.15 m schematic walls. Room areas exclude schematic wall faces.',
      'Stairs are aligned schematic reservations; rise/run, structure and vertical clearance are not validated.',
      'Flexible space marks excess footprint requiring further design; the generator does not optimize adjacency or proportions.',
      'Furniture, parking and window symbols are illustrative. No egress, accessibility, daylight, MEP or code-compliance approval.',
      ...(Array.isArray(input.notes) ? input.notes.filter(note => typeof note === 'string').slice(0, 8).map(note => note.slice(0, 300)) : [])],
    checks: ['Room zones fit the plot', 'Room zones do not overlap on each floor', 'Every room has a corridor opening', 'Template minimum room depths checked', ...(floorCount > 1 ? ['Stair reservations align across floors'] : [])]
  }
}

// AI may choose the corridor split, room sides, order and depths. Geometry stays
// within a connected full-depth corridor topology that we can verify precisely.
export function validateAIPlacement(base, placement) {
  const errors = [], tolerance = 0.001
  if (!placement || !Number.isFinite(placement.leftWidth) || !Array.isArray(placement.rooms)) return ['Invalid placement object']
  const widths = [placement.leftWidth, base.building.width - 1.2 - placement.leftWidth]
  if (widths.some(width => !Number.isFinite(width) || width < 2.7)) errors.push('Both room columns must be at least 2.7 m wide')
  const ids = new Set()
  for (const proposed of placement.rooms) {
    const room = base.rooms.find(item => item.id === proposed.id)
    if (!room || ids.has(proposed.id)) { errors.push(`Unknown or duplicate room: ${proposed.id}`); continue }
    ids.add(proposed.id)
    if (![0, 1].includes(proposed.side) || !Number.isFinite(proposed.y) || !Number.isFinite(proposed.height)) { errors.push(`Invalid coordinates: ${room.name}`); continue }
    const minimum = room.name === 'Flexible space' ? 1.8 : minDepth(room.name)
    if (proposed.height < minimum - tolerance) errors.push(`${room.id} depth must be at least ${minimum} m`)
    if (proposed.y < base.building.y - tolerance || proposed.y + proposed.height > base.building.y + base.building.height + tolerance) errors.push(`${room.id} exceeds the building bounds`)
    if (/Bedroom|Living|Lounge|Office|Dining/.test(room.name) && Math.max(widths[proposed.side], proposed.height) / Math.min(widths[proposed.side], proposed.height) > 3) errors.push(`${room.id} aspect ratio exceeds 3:1`)
  }
  for (const room of base.rooms) if (!ids.has(room.id)) errors.push(`Missing room: ${room.id}`)
  for (const floor of base.floors) {
    for (const side of [0, 1]) {
      const column = placement.rooms.filter(item => item.side === side && base.rooms.find(room => room.id === item.id)?.floorId === floor.id).sort((a, b) => a.y - b.y)
      let end = base.building.y
      for (const room of column) {
        if (Math.abs(room.y - end) > tolerance) errors.push(`${floor.id} side ${side}: gap or overlap before ${room.id}; expected y=${round(end)}`)
        end = room.y + room.height
      }
      if (Math.abs(end - base.building.y - base.building.height) > tolerance) errors.push(`${floor.id} side ${side} must cover full depth through y=${round(base.building.y + base.building.height)}`)
    }
  }
  const stairs = base.rooms.filter(room => room.name === 'Stairs').map(room => placement.rooms.find(item => item.id === room.id)).filter(Boolean)
  if (stairs.some(room => room.side !== stairs[0].side || Math.abs(room.y - stairs[0].y) > tolerance || Math.abs(room.height - stairs[0].height) > tolerance)) errors.push('Stair side, y and height must match across floors')
  return [...new Set(errors)].slice(0, 16)
}

export function selectPlanFloor(plan, floorId) {
  if (!floorId || floorId === 'all') return plan
  const floor = plan.floors.find(item => item.id === floorId)
  if (!floor) throw new Error('Unknown floor.')
  const dx = floor.offsetX
  return { ...plan, floors: [{ ...floor, offsetX: 0 }],
    rooms: plan.rooms.filter(item => item.floorId === floorId).map(item => ({ ...item, x: round(item.x - dx) })),
    doors: plan.doors.filter(item => item.floorId === floorId),
    lines: plan.lines.filter(item => item.floorId === floorId).map(item => ({ ...item, x1: round(item.x1 - dx), x2: round(item.x2 - dx) })),
    labels: plan.labels.filter(item => item.floorId === floorId).map(item => ({ ...item, x: round(item.x - dx) })),
    bounds: { x: -0.7, y: -0.4, width: plan.plot.width + 4, height: plan.plot.depth + 3 } }
}

export function floorPlanDxf(plan, { version = 'R12', units = 'm' } = {}) {
  if (!['R12', 'R2000'].includes(version) || !['m', 'mm'].includes(units)) throw new Error('Use R12 or R2000 DXF and m or mm units.')
  const scale = units === 'mm' ? 1000 : 1, modern = version === 'R2000'
  const tags = [], add = (...values) => tags.push(...values.map(String))
  let handle = 16
  const identity = () => { if (modern) add(5, (handle++).toString(16).toUpperCase()) }
  add(0, 'SECTION', 2, 'HEADER', 9, '$ACADVER', 1, modern ? 'AC1015' : 'AC1009', 9, '$MEASUREMENT', 70, 1)
  if (modern) add(9, '$INSUNITS', 70, units === 'mm' ? 4 : 6)
  add(0, 'ENDSEC', 0, 'SECTION', 2, 'TABLES', 0, 'TABLE', 2, 'LAYER'); identity()
  if (modern) add(100, 'AcDbSymbolTable')
  add(70, Object.keys(layers).length)
  for (const [name, color] of Object.entries(layers)) {
    add(0, 'LAYER'); identity()
    if (modern) add(100, 'AcDbSymbolTableRecord', 100, 'AcDbLayerTableRecord')
    add(2, name, 70, 0, 62, color, 6, 'CONTINUOUS')
  }
  add(0, 'ENDTAB', 0, 'ENDSEC', 0, 'SECTION', 2, 'BLOCKS', 0, 'ENDSEC', 0, 'SECTION', 2, 'ENTITIES')
  const entity = (kind, layer, subtype) => {
    add(0, kind); identity()
    if (modern) add(100, 'AcDbEntity')
    add(8, layer)
    if (modern) add(100, subtype)
  }
  const allLines = [...plan.lines]
  // A visible sheet frame also prevents some CAD print-fit engines from clipping text extents.
  const { x, y, width, height } = plan.bounds
  for (const [x1, y1, x2, y2] of [[x, y, x + width, y], [x + width, y, x + width, y + height], [x + width, y + height, x, y + height], [x, y + height, x, y]]) allLines.push({ layer: 'FRAME', x1, y1, x2, y2 })
  for (const item of allLines) {
    entity('LINE', item.layer, 'AcDbLine')
    add(10, round(item.x1 * scale), 20, round(item.y1 * scale), 30, 0, 11, round(item.x2 * scale), 21, round(item.y2 * scale), 31, 0)
  }
  for (const item of plan.labels) {
    entity('TEXT', item.layer || 'LABELS', 'AcDbText')
    const exportText = item.text.replace('CONCEPT ONLY - METRES', `CONCEPT ONLY - UNITS: ${units.toUpperCase()}`)
    add(10, round(item.x * scale), 20, round(item.y * scale), 30, 0, 40, round(item.height * scale), 1, exportText.replace(/[^\x20-\x7E]/g, '?'), 50, 0, 7, 'STANDARD')
    if (modern) add(100, 'AcDbText')
  }
  add(0, 'ENDSEC', 0, 'EOF')
  return tags.join('\n') + '\n'
}

export function floorPlanSvg(plan) {
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]))
  const b = plan.bounds, top = b.y + b.height
  const strokes = { WALLS: '#182335', DOORS: '#15803d', WINDOWS: '#2563eb', PLOT: '#7a8798', FURNITURE: '#7a8798', STAIRS: '#586577', DIMENSIONS: '#7a8798', SITE: '#15803d' }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x} 0 ${b.width} ${b.height}" width="1400" height="1000"><rect x="${b.x}" y="0" width="${b.width}" height="${b.height}" fill="white"/>${plan.lines.map(item => `<line x1="${item.x1}" y1="${top - item.y1}" x2="${item.x2}" y2="${top - item.y2}" stroke="${strokes[item.layer] || '#182335'}" stroke-width="0.025"/>`).join('')}${plan.labels.map(item => `<text x="${item.x}" y="${top - item.y}" font-family="sans-serif" font-size="${item.height}" fill="#182335">${escape(item.text)}</text>`).join('')}</svg>`
}

export function floorPlanScheduleCsv(plan) {
  const quote = value => `"${String(value).replaceAll('"', '""')}"`
  return ['Door ID,Floor,Room,Opening width (m)', ...plan.doors.map(door => [door.id, door.floorId, door.room, door.width].map(quote).join(','))].join('\r\n') + '\r\n'
}
