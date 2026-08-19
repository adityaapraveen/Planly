import assert from 'node:assert/strict'

import { rankEvidenceChunks } from '../src/services/retrieval-ranking.js'

const chunks = [
    {
        sourceId: 'sheet-accessible-route',
        title: 'A102 — Entry and circulation plan',
        content: 'Barrier-free path from accessible parking to the main lobby.',
        embedding: [1, 0, 0],
        metadata: { id: 'sheet-accessible-route' }
    },
    {
        sourceId: 'reference-a501',
        title: '4/A501 — Exterior wall head detail',
        content: 'Resolved wall section reference from north elevation.',
        embedding: [0, 1, 0],
        metadata: { id: 'reference-a501' }
    },
    {
        sourceId: 'sheet-door-schedule',
        title: 'A601 — Door schedule',
        content: 'Door types, fire ratings, and hardware groups.',
        embedding: [0, 0, 1],
        metadata: { id: 'sheet-door-schedule' }
    },
    {
        sourceId: 'finding-stair',
        title: 'Stair width needs review',
        content: 'Coordination finding at the main stair enclosure.',
        embedding: [0.2, 0.2, 0.1],
        metadata: { id: 'finding-stair' }
    }
]

const cases = [
    {
        query: 'How can someone enter without using steps?',
        tokens: ['someone', 'enter', 'without', 'using', 'steps'],
        embedding: [1, 0, 0],
        expected: 'sheet-accessible-route'
    },
    {
        query: 'Show 4/A501 wall detail',
        tokens: ['show', 'a501', 'wall', 'detail'],
        embedding: [0, 1, 0],
        expected: 'reference-a501'
    },
    {
        query: 'Where are door fire ratings?',
        tokens: ['door', 'fire', 'ratings'],
        embedding: [0, 0, 1],
        expected: 'sheet-door-schedule'
    }
]

let hitsAtThree = 0
let reciprocalRank = 0

for (const item of cases) {
    const ranking = rankEvidenceChunks({
        chunks,
        query: item.query,
        tokens: item.tokens,
        queryEmbedding: item.embedding,
        limit: 3
    })
    const rank = ranking.results.findIndex((result) => result.sourceId === item.expected) + 1
    if (rank > 0 && rank <= 3) hitsAtThree += 1
    if (rank > 0) reciprocalRank += 1 / rank
}

const metrics = {
    cases: cases.length,
    hitRateAt3: hitsAtThree / cases.length,
    meanReciprocalRank: reciprocalRank / cases.length
}

console.log(JSON.stringify({ suite: 'project-retrieval-smoke-v1', metrics }, null, 2))

assert.ok(metrics.hitRateAt3 >= 1, 'Expected hit rate@3 to remain at 100%')
assert.ok(metrics.meanReciprocalRank >= 0.9, 'Expected MRR to remain at or above 0.9')
