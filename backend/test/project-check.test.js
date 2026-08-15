import test from 'node:test'
import assert from 'node:assert/strict'

import { evaluateProjectChecks } from '../src/services/project-check.service.js'

const drawing = { id: 'drawing-one', fileName: 'permit-set.pdf' }
const page = (id, pageNumber, sheetNumber, reviewStatus = 'AI_EXTRACTED') => ({
    id,
    pageNumber,
    drawingId: drawing.id,
    drawing,
    sheet: {
        id: `sheet-${id}`,
        sheetNumber,
        reviewStatus
    }
})

test('evaluateProjectChecks reports deterministic metadata and reference failures', () => {
    const pages = [
        page('page-1', 1, 'A101'),
        page('page-2', 2, 'a 101'),
        page('page-3', 3, null, 'NEEDS_REVIEW')
    ]
    const references = [{
        id: 'reference-1',
        label: '3/A501',
        targetSheetNumber: 'A501',
        resolutionStatus: 'MISSING_TARGET',
        hasLocation: true,
        x: 0.1,
        y: 0.2,
        width: 0.1,
        height: 0.1,
        sourcePage: pages[0]
    }]

    const report = evaluateProjectChecks({ pages, references })
    const byKey = Object.fromEntries(report.checks.map((check) => [check.key, check]))

    assert.equal(byKey.MISSING_SHEET_NUMBER.findingCount, 1)
    assert.equal(byKey.DUPLICATE_SHEET_NUMBER.findingCount, 2)
    assert.equal(byKey.BROKEN_REFERENCE.findingCount, 1)
    assert.equal(byKey.AMBIGUOUS_REFERENCE.status, 'PASS')
    assert.equal(byKey.LOW_CONFIDENCE_METADATA.findingCount, 1)
    assert.equal(report.summary.failing, 4)
})

test('evaluateProjectChecks respects project settings and reports not-ready state', () => {
    const disabled = evaluateProjectChecks({
        pages: [page('page-1', 1, 'A101')],
        references: [],
        settings: [{
            checkKey: 'MISSING_SHEET_NUMBER',
            enabled: false,
            severity: 'HIGH'
        }]
    })
    const disabledCheck = disabled.checks.find((check) =>
        check.key === 'MISSING_SHEET_NUMBER'
    )
    assert.equal(disabledCheck.status, 'DISABLED')
    assert.equal(disabledCheck.severity, 'HIGH')

    const notReady = evaluateProjectChecks({
        pages: [{
            id: 'unindexed',
            pageNumber: 1,
            drawingId: drawing.id,
            drawing,
            sheet: null
        }],
        references: []
    })
    assert.equal(notReady.summary.notReady, 6)
})
