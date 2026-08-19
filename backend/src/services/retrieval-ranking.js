const roundScore = (value) => Math.round(Number(value || 0) * 10_000) / 10_000

export const cosineSimilarity = (left, right) => {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || left.length === 0) {
        return null
    }

    let dot = 0
    let leftMagnitude = 0
    let rightMagnitude = 0
    for (let index = 0; index < left.length; index += 1) {
        const leftValue = Number(left[index])
        const rightValue = Number(right[index])
        if (!Number.isFinite(leftValue) || !Number.isFinite(rightValue)) return null
        dot += leftValue * rightValue
        leftMagnitude += leftValue * leftValue
        rightMagnitude += rightValue * rightValue
    }

    if (leftMagnitude === 0 || rightMagnitude === 0) return null
    return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude))
}

export const lexicalEvidenceScore = (item, query, tokens) => {
    const title = String(item.title || '').toLocaleLowerCase('en-US')
    const content = String(item.content || '').toLocaleLowerCase('en-US')
    const phrase = String(query || '').trim().toLocaleLowerCase('en-US')
    const titleMatches = tokens.filter((token) => title.includes(token)).length
    const contentMatches = tokens.filter((token) => content.includes(token)).length
    const phraseBoost = phrase.length > 1 && `${title} ${content}`.includes(phrase) ? 6 : 0

    return (titleMatches * 2) + contentMatches + phraseBoost
}

const ranksById = (items) => new Map(items.map((item, index) => [item.sourceId, index + 1]))

export const rankEvidenceChunks = ({
    chunks,
    query,
    tokens,
    queryEmbedding = null,
    limit = 50
}) => {
    const scored = chunks.map((chunk) => ({
        ...chunk,
        lexicalScore: lexicalEvidenceScore(chunk, query, tokens),
        semanticScore: cosineSimilarity(chunk.embedding, queryEmbedding)
    }))
    const lexicalRanking = scored
        .filter((item) => item.lexicalScore > 0)
        .sort((left, right) => right.lexicalScore - left.lexicalScore)
    const semanticRanking = scored
        .filter((item) => item.semanticScore !== null)
        .sort((left, right) => right.semanticScore - left.semanticScore)
    const lexicalRanks = ranksById(lexicalRanking)
    const semanticRanks = ranksById(semanticRanking)
    const semanticAvailable = semanticRanking.length > 0
    const candidateIds = new Set([
        ...lexicalRanking.map((item) => item.sourceId),
        ...semanticRanking.slice(0, Math.max(limit * 3, 50)).map((item) => item.sourceId)
    ])

    const ranked = scored
        .filter((item) => candidateIds.has(item.sourceId))
        .map((item) => {
            const lexicalRank = lexicalRanks.get(item.sourceId) || null
            const semanticRank = semanticRanks.get(item.sourceId) || null
            const hybridScore =
                (lexicalRank ? 1 / (60 + lexicalRank) : 0) +
                (semanticRank ? 1 / (60 + semanticRank) : 0)
            const reasons = []
            if (item.lexicalScore > 0) reasons.push(`${item.lexicalScore} keyword relevance`)
            if (item.semanticScore !== null) {
                reasons.push(`${Math.round(item.semanticScore * 100)}% semantic similarity`)
            }

            return {
                ...item,
                hybridScore,
                retrieval: {
                    lexicalRank,
                    semanticRank,
                    lexicalScore: item.lexicalScore,
                    semanticScore: item.semanticScore === null
                        ? null
                        : roundScore(item.semanticScore),
                    reasons
                }
            }
        })
        .sort((left, right) => right.hybridScore - left.hybridScore)
        .slice(0, limit)
        .map((item, index) => ({
            ...item,
            relevance: roundScore(item.hybridScore),
            retrieval: {
                ...item.retrieval,
                rank: index + 1,
                mode: semanticAvailable ? 'HYBRID' : 'LEXICAL'
            }
        }))

    return {
        mode: semanticAvailable ? 'HYBRID' : 'LEXICAL',
        candidates: candidateIds.size,
        results: ranked
    }
}
