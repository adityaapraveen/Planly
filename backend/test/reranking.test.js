import test from 'node:test'
import assert from 'node:assert/strict'

import { applyRerankResults } from '../src/services/reranking.js'

const candidates = [
    { sourceId: 'a', relevance: 0.03, retrieval: { rank: 1, reasons: ['keyword'] } },
    { sourceId: 'b', relevance: 0.02, retrieval: { rank: 2, reasons: ['semantic'] } },
    { sourceId: 'c', relevance: 0.01, retrieval: { rank: 3, reasons: [] } }
]

test('applyRerankResults reorders candidates and preserves first-stage provenance', () => {
    const reranked = applyRerankResults({
        candidates,
        results: [
            { index: 1, relevance_score: 0.91 },
            { index: 0, relevance_score: 0.42 }
        ]
    })

    assert.deepEqual(reranked.map((item) => item.sourceId), ['b', 'a', 'c'])
    assert.equal(reranked[0].relevance, 0.91)
    assert.equal(reranked[0].firstStageRelevance, 0.02)
    assert.equal(reranked[0].retrieval.rerankRank, 1)
    assert.match(reranked[0].retrieval.reasons.at(-1), /rerank relevance/)
})

test('applyRerankResults rejects duplicate or invalid provider indexes', () => {
    assert.throws(() => applyRerankResults({
        candidates,
        results: [
            { index: 0, relevance_score: 0.9 },
            { index: 0, relevance_score: 0.8 }
        ]
    }), /invalid result/)

    assert.throws(() => applyRerankResults({
        candidates,
        results: [{ index: 9, relevance_score: 0.9 }]
    }), /invalid result/)
})
