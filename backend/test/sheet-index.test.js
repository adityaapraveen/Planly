import test from 'node:test'
import assert from 'node:assert/strict'

import {
    buildSheetDiagnostics,
    extractionToSheetData,
    shouldRefreshExtractedSheet
} from '../src/services/sheet-index.service.js'

const metadataField = (value, confidence = 0.9) => ({
    value,
    confidence,
    evidence: value ? `Visible value: ${value}` : 'Not visible.'
})

test('only unreviewed AI metadata can be replaced by a rerun', () => {
    assert.equal(shouldRefreshExtractedSheet('AI_EXTRACTED'), true)
    assert.equal(shouldRefreshExtractedSheet('NEEDS_REVIEW'), true)
    assert.equal(shouldRefreshExtractedSheet('CORRECTED'), false)
    assert.equal(shouldRefreshExtractedSheet('CONFIRMED'), false)
})

test('extractionToSheetData retains evidence and flags uncertain sheet numbers', () => {
    const data = extractionToSheetData({
        sheetNumber: metadataField(null, 0.1),
        title: metadataField('Floor Plan'),
        discipline: metadataField('Architectural'),
        revision: metadataField(null, 0.2),
        issueDate: metadataField('13 Aug 2026'),
        confidence: 0.62,
        titleBlockLocation: { x: 0.8, y: 0.7, width: 0.2, height: 0.3 }
    })

    assert.equal(data.sheetNumber, null)
    assert.equal(data.reviewStatus, 'NEEDS_REVIEW')
    assert.equal(data.fieldConfidence.title, 0.9)
    assert.match(data.evidence.title, /Floor Plan/)
})

test('buildSheetDiagnostics reports missing and duplicate sheet numbers', () => {
    const diagnostics = buildSheetDiagnostics([
        {
            id: 'one',
            pageNumber: 1,
            sheetNumber: 'A101',
            reviewStatus: 'AI_EXTRACTED'
        },
        {
            id: 'two',
            pageNumber: 2,
            sheetNumber: 'a101',
            reviewStatus: 'AI_EXTRACTED'
        },
        {
            id: 'three',
            pageNumber: 3,
            sheetNumber: null,
            reviewStatus: 'NEEDS_REVIEW'
        }
    ])

    assert.equal(
        diagnostics.filter((item) => item.code === 'DUPLICATE_SHEET_NUMBER').length,
        1
    )
    assert.equal(
        diagnostics.filter((item) => item.code === 'MISSING_SHEET_NUMBER').length,
        1
    )
    assert.equal(
        diagnostics.filter((item) => item.code === 'LOW_CONFIDENCE_METADATA').length,
        1
    )
})
