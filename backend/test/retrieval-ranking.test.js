import test from 'node:test'
import assert from 'node:assert/strict'

import {
    cosineSimilarity,
    rankEvidenceChunks
} from '../src/services/retrieval-ranking.js'

const chunk = (sourceId, title, content, embedding) => ({
    sourceId,
    title,
    content,
    embedding,
    metadata: { id: sourceId, title }
})

test('cosineSimilarity validates vector shape and ranks aligned vectors highest', () => {
    assert.equal(cosineSimilarity([1, 0], [1, 0]), 1)
    assert.equal(cosineSimilarity([1, 0], [0, 1]), 0)
    assert.equal(cosineSimilarity([1], [1, 0]), null)
})

test('rankEvidenceChunks retrieves semantic matches without keyword overlap', () => {
    const ranking = rankEvidenceChunks({
        query: 'entry without steps',
        tokens: ['entry', 'without', 'steps'],
        queryEmbedding: [1, 0],
        chunks: [
            chunk('accessible', 'Accessible route', 'Barrier-free circulation from site to lobby', [1, 0]),
            chunk('stairs', 'Main stair', 'Stair enclosure detail', [0.2, 0.8]),
            chunk('mechanical', 'Mechanical plan', 'Air handling equipment', [0, 1])
        ],
        limit: 3
    })

    assert.equal(ranking.mode, 'HYBRID')
    assert.equal(ranking.results[0].sourceId, 'accessible')
    assert.equal(ranking.results[0].retrieval.semanticRank, 1)
})

test('rankEvidenceChunks preserves exact keyword evidence in hybrid ranking', () => {
    const ranking = rankEvidenceChunks({
        query: 'A501 wall detail',
        tokens: ['a501', 'wall', 'detail'],
        queryEmbedding: [0, 1],
        chunks: [
            chunk('a501', 'A501 — Wall details', 'Exterior wall head and sill details', [1, 0]),
            chunk('other', 'General notes', 'Project notes and abbreviations', [0, 1])
        ],
        limit: 2
    })

    assert.equal(ranking.results[0].sourceId, 'a501')
    assert.equal(ranking.results[0].retrieval.lexicalRank, 1)
})

test('rankEvidenceChunks abstains when semantic similarity does not clear the relevance gate', () => {
    const ranking = rankEvidenceChunks({
        query: 'What is the catering budget?',
        tokens: ['catering', 'budget'],
        queryEmbedding: [1, 1, 1],
        chunks: [
            chunk('door', 'A601 — Door schedule', 'Door types and hardware groups', [1, 0, 0]),
            chunk('roof', 'A301 — Roof plan', 'Roof drainage plan', [0, 1, 0]),
            chunk('site', 'C101 — Site plan', 'Parking and grading', [0, 0, 1])
        ],
        limit: 3
    })

    assert.equal(ranking.mode, 'LEXICAL')
    assert.equal(ranking.candidates, 0)
    assert.deepEqual(ranking.results, [])
})

test('rankEvidenceChunks degrades to lexical retrieval without a query vector', () => {
    const ranking = rankEvidenceChunks({
        query: 'door schedule',
        tokens: ['door', 'schedule'],
        chunks: [
            chunk('door', 'A601 — Door schedule', 'Door types and hardware groups', [1, 0]),
            chunk('roof', 'A301 — Roof plan', 'Roof drainage plan', [0, 1])
        ],
        limit: 2
    })

    assert.equal(ranking.mode, 'LEXICAL')
    assert.equal(ranking.results[0].sourceId, 'door')
    assert.equal(ranking.results.length, 1)
})
