import test from 'node:test'
import assert from 'node:assert/strict'

import {
    calculateOverallScore,
    parsePageAnalysis
} from '../src/services/analysis-result.js'

const validResult = {
    score: 80,
    summary: 'One visible coordination issue.',
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
