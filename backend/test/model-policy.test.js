import test from 'node:test'
import assert from 'node:assert/strict'

import { validateOpenRouterModelPolicy } from '../src/config/model-policy.js'

const freeStack = [
    { field: 'OPENROUTER_MODEL', model: 'dots-studio/dots-3-note-preview:free' },
    { field: 'AI_EMBEDDING_MODEL', model: 'liquid/lfm-2.5-embedding-350m:free' },
    { field: 'AI_RERANK_MODEL', model: 'nvidia/llama-nemotron-rerank-vl-1b-v2:free' }
]

test('model policy accepts three distinct free specialist models', () => {
    assert.deepEqual(validateOpenRouterModelPolicy({
        models: freeStack,
        requireFree: true
    }), [])
})

test('model policy rejects duplicate specialist models', () => {
    const violations = validateOpenRouterModelPolicy({
        models: [freeStack[0], { ...freeStack[1], model: freeStack[0].model }],
        requireFree: true
    })

    assert.match(violations[0].message, /distinct model identifiers/i)
})

test('model policy rejects paid model identifiers in free-only mode', () => {
    const violations = validateOpenRouterModelPolicy({
        models: [{ field: 'OPENROUTER_MODEL', model: 'vendor/paid-model' }],
        requireFree: true
    })

    assert.equal(violations[0].field, 'OPENROUTER_MODEL')
    assert.match(violations[0].message, /:free/)
})
