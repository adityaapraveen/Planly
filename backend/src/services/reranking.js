const roundScore = (value) => Math.round(Number(value) * 10_000) / 10_000

export const applyRerankResults = ({ candidates, results }) => {
    if (!Array.isArray(candidates) || !Array.isArray(results)) {
        throw new Error('Rerank candidates and results must be arrays')
    }

    const seenIndexes = new Set()
    const reranked = results.map((result, rankIndex) => {
        const index = Number(result?.index)
        const score = Number(result?.relevance_score)
        if (
            !Number.isInteger(index) || index < 0 || index >= candidates.length ||
            !Number.isFinite(score) || seenIndexes.has(index)
        ) {
            throw new Error('Rerank provider returned an invalid result')
        }
        seenIndexes.add(index)
        const candidate = candidates[index]
        return {
            ...candidate,
            firstStageRelevance: candidate.relevance,
            relevance: roundScore(score),
            retrieval: {
                ...candidate.retrieval,
                rerankRank: rankIndex + 1,
                rerankScore: roundScore(score),
                reasons: [
                    ...(candidate.retrieval?.reasons || []),
                    `${Math.round(score * 100)}% rerank relevance`
                ]
            }
        }
    })

    const untouched = candidates.filter((_, index) => !seenIndexes.has(index))
    return [...reranked, ...untouched]
}
