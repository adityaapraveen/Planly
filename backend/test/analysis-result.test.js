import test from 'node:test'
import assert from 'node:assert/strict'

import {
    calculateOverallScore,
    parsePageAnalysis
} from '../src/services/analysis-result.js'

const validResult = {
    score: 80,
    summary: 'One visible coordination issue.',
    sheetMetadata: {
        sheetNumber: {
            value: ' A101 ',
            confidence: 0.96,
            evidence: 'Title block reads A101.'
        },
        title: {
            value: 'Ground Floor Plan',
            confidence: 0.91,
            evidence: 'Title block reads Ground Floor Plan.'
        },
        discipline: {
            value: 'Architectural',
            confidence: 0.85,
            evidence: 'A-prefix and architectural plan content.'
        },
        revision: {
            value: null,
            confidence: 0.2,
            evidence: 'No revision identifier was visible.'
        },
        issueDate: {
            value: '08/13/2026',
            confidence: 0.88,
            evidence: 'Issue date in title block.'
        },
        titleBlockLocation: {
            x: 0.75,
            y: 0.7,
            width: 0.3,
            height: 0.4
        }
    },
    sheetReferences: [{
        referenceType: 'DETAIL',
        label: '3/A501',
        detailNumber: 3,
        targetSheetNumber: 'A501',
        confidence: 0.92,
        evidence: 'Detail callout reads 3/A501.',
        location: {
            x: 0.4,
            y: 0.5,
            width: 0.08,
            height: 0.04
        }
    }],
    issues: [{
        title: 'Door conflicts with circulation path',
        category: 'Coordination',
        severity: 'High',
        confidence: 0.8,
        page: 99,
        location: {
            x: 0.1,
            y: 0.2,
            width: 0.3,
            height: 0.4
        },
        explanation: 'The swing appears to obstruct the primary path.',
        recommendation: 'Review the door handing and required clearance.'
    }]
}

test('parsePageAnalysis validates and normalizes model output', () => {
    const result = parsePageAnalysis(JSON.stringify(validResult), 2)

    assert.equal(result.issues[0].page, 2)
    assert.equal(result.issues[0].hasLocation, true)
    assert.equal(result.summary, validResult.summary)
    assert.equal(result.sheetMetadata.sheetNumber.value, 'A101')
    assert.equal(result.sheetMetadata.titleBlockLocation.width, 0.3)
    assert.equal(result.sheetMetadata.titleBlockLocation.height, 0.4)
    assert.equal(result.sheetReferences[0].detailNumber, '3')
    assert.equal(result.sheetReferences[0].targetSheetNumber, 'A501')
})

test('parsePageAnalysis rejects malformed output instead of returning no issues', () => {
    assert.throws(
        () => parsePageAnalysis('not-json', 1),
        /not valid JSON/
    )
})

test('parsePageAnalysis rejects incomplete findings', () => {
    const incomplete = {
        score: 100,
        summary: 'Looks fine',
        issues: [{ title: 'Missing evidence' }]
    }

    assert.throws(
        () => parsePageAnalysis(incomplete, 1),
        /analysis contract/
    )
})

test('calculateOverallScore weights severity and confidence transparently', () => {
    const score = calculateOverallScore([
        { severity: 'High', confidence: 1 },
        { severity: 'Medium', confidence: 0 },
        { severity: 'Low', confidence: 0.5 }
    ])

    assert.equal(score, 72)
})
