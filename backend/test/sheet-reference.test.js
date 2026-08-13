import test from 'node:test'
import assert from 'node:assert/strict'

import {
    normalizeSheetNumber,
    reconcileSheetReferences,
    resolveSheetReferences
} from '../src/services/sheet-reference.service.js'

const page = ({ id, pageNumber, sheetId, sheetNumber }) => ({
    id,
    pageNumber,
    sheet: sheetId
        ? { id: sheetId, sheetNumber }
        : null
})

const reference = ({
    targetSheetNumber,
    confidence = 0.9,
    label = `1/${targetSheetNumber}`,
    x = 0.1
}) => ({
    referenceType: 'DETAIL',
    label,
    detailNumber: '1',
    targetSheetNumber,
    confidence,
    evidence: `Visible callout ${label}`,
    location: { x, y: 0.2, width: 0.1, height: 0.1 },
    hasLocation: true
})

test('normalizeSheetNumber ignores case and spacing without removing punctuation', () => {
    assert.equal(normalizeSheetNumber(' a 501 '), 'A501')
    assert.equal(normalizeSheetNumber('A-501'), 'A-501')
})

test('resolveSheetReferences resolves unique targets and flags graph defects', () => {
    const pages = [
        page({ id: 'page-1', pageNumber: 1, sheetId: 'sheet-a101', sheetNumber: 'A101' }),
        page({ id: 'page-2', pageNumber: 2, sheetId: 'sheet-a501-a', sheetNumber: 'A501' }),
        page({ id: 'page-3', pageNumber: 3, sheetId: 'sheet-a501-b', sheetNumber: 'a 501' }),
        page({ id: 'page-4', pageNumber: 4, sheetId: 'sheet-s101', sheetNumber: 'S101' })
    ]
    const pageResults = [{
        pageNumber: 1,
        sheetReferences: [
            reference({ targetSheetNumber: 'S101' }),
            reference({ targetSheetNumber: 'A501', x: 0.3 }),
            reference({ targetSheetNumber: 'M201', x: 0.5 }),
            reference({ targetSheetNumber: 'S101', confidence: 0.2, x: 0.7 })
        ]
    }]

    const resolved = resolveSheetReferences({ pages, pageResults })

    assert.deepEqual(
        resolved.map((item) => item.resolutionStatus),
        ['RESOLVED', 'AMBIGUOUS_TARGET', 'MISSING_TARGET', 'LOW_CONFIDENCE']
    )
    assert.equal(resolved[0].targetSheetId, 'sheet-s101')
    assert.equal(resolved[1].targetSheetId, null)
    assert.equal(resolved[2].targetSheetId, null)
    assert.equal(resolved[3].targetSheetId, 'sheet-s101')
})

test('resolveSheetReferences removes exact duplicate model detections', () => {
    const pages = [
        page({ id: 'page-1', pageNumber: 1, sheetId: 'sheet-a101', sheetNumber: 'A101' }),
        page({ id: 'page-2', pageNumber: 2, sheetId: 'sheet-a501', sheetNumber: 'A501' })
    ]
    const duplicate = reference({ targetSheetNumber: 'A501' })
    const pageResults = [{
        pageNumber: 1,
        sheetReferences: [duplicate, { ...duplicate }]
    }]

    const resolved = resolveSheetReferences({ pages, pageResults })
    assert.equal(resolved.length, 1)
})

test('reconcileSheetReferences repairs graph edges after a sheet correction', () => {
    const references = [{
        id: 'reference-1',
        targetSheetNumber: 'A501',
        confidence: 0.9
    }]
    const beforeCorrection = [
        page({ id: 'page-1', pageNumber: 1, sheetId: 'sheet-a101', sheetNumber: 'A101' }),
        page({ id: 'page-2', pageNumber: 2, sheetId: 'sheet-a50i', sheetNumber: 'A50I' })
    ]
    const afterCorrection = [
        beforeCorrection[0],
        page({ id: 'page-2', pageNumber: 2, sheetId: 'sheet-a50i', sheetNumber: 'A501' })
    ]

    assert.deepEqual(
        reconcileSheetReferences({ pages: beforeCorrection, references }),
        [{
            id: 'reference-1',
            resolutionStatus: 'MISSING_TARGET',
            targetSheetId: null
        }]
    )
    assert.deepEqual(
        reconcileSheetReferences({ pages: afterCorrection, references }),
        [{
            id: 'reference-1',
            resolutionStatus: 'RESOLVED',
            targetSheetId: 'sheet-a50i'
        }]
    )
})
