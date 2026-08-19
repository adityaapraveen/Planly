import test from 'node:test'
import assert from 'node:assert/strict'

import { analysisFailureData } from '../src/services/analysis-error.js'

test('analysisFailureData converts numeric provider codes to persisted strings', () => {
    const result = analysisFailureData({
        code: 404,
        message: 'Provider returned error'
    }, 1250)

    assert.equal(result.status, 'FAILED')
    assert.equal(result.errorCode, '404')
    assert.equal(result.errorMessage, 'Provider returned error')
    assert.equal(result.durationMs, 1250)
    assert.ok(result.completedAt instanceof Date)
})

test('analysisFailureData applies safe bounded fallbacks', () => {
    const result = analysisFailureData({
        code: { nested: true },
        message: 'x'.repeat(2500)
    }, 10)

    assert.equal(result.errorCode, 'ANALYSIS_FAILED')
    assert.equal(result.errorMessage.length, 2000)
})
