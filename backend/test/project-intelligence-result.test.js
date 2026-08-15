import test from 'node:test'
import assert from 'node:assert/strict'

import { parseCitedAnswer } from '../src/services/project-intelligence-result.js'
import { tokenizeEvidenceQuery } from '../src/services/project-intelligence.service.js'

const evidence = [{
    id: 'sheet:one',
    type: 'SHEET',
    title: 'A101 — Ground Floor Plan',
    snippet: 'Architectural drawing',
    drawingId: 'drawing-one',
    pageNumber: 2
}]

test('parseCitedAnswer resolves only supplied project citations', () => {
    const result = parseCitedAnswer({
        answer: 'The ground floor plan is on A101.',
        citationIds: ['sheet:one', 'sheet:one'],
        confidence: 0.93,
        insufficientEvidence: false
    }, evidence)

    assert.equal(result.status, 'ANSWERED')
    assert.equal(result.citations.length, 1)
    assert.equal(result.citations[0].pageNumber, 2)
})

test('parseCitedAnswer rejects hallucinated citation ids', () => {
    assert.throws(() => parseCitedAnswer({
        answer: 'Unsupported answer.',
        citationIds: ['sheet:not-supplied'],
        confidence: 0.8,
        insufficientEvidence: false
    }, evidence), /outside the project context/)
})

test('parseCitedAnswer requires citations for a substantive answer', () => {
    assert.throws(() => parseCitedAnswer({
        answer: 'Uncited answer.',
        citationIds: [],
        confidence: 0.8,
        insufficientEvidence: false
    }, evidence), /not supported/)
})

test('parseCitedAnswer permits explicit insufficient-evidence responses', () => {
    const result = parseCitedAnswer({
        answer: 'The indexed set does not show this information.',
        citationIds: [],
        confidence: 0.2,
        insufficientEvidence: true
    }, evidence)
    assert.equal(result.status, 'INSUFFICIENT_EVIDENCE')
})

test('parseCitedAnswer rejects contradictory insufficient-evidence citations', () => {
    assert.throws(() => parseCitedAnswer({
        answer: 'There is not enough evidence.',
        citationIds: ['sheet:one'],
        confidence: 0.2,
        insufficientEvidence: true
    }, evidence), /while declaring insufficient evidence/)
})

test('tokenizeEvidenceQuery removes filler words and keeps useful identifiers', () => {
    assert.deepEqual(
        tokenizeEvidenceQuery('What is shown on sheet A-501 and Level 2?'),
        ['shown', 'sheet', 'a-501', 'level']
    )
})
