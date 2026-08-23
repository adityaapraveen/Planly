export const validateOpenRouterModelPolicy = ({ models, requireFree }) => {
    const activeModels = models.filter((entry) => entry && entry.model)
    const violations = []

    if (requireFree && new Set(activeModels.map(({ model }) => model)).size !== activeModels.length) {
        violations.push({
            field: 'AI_PROVIDER',
            message: 'Generation, embedding, and reranking must use distinct model identifiers'
        })
    }

    if (requireFree) {
        for (const { field, model } of activeModels) {
            if (!model.endsWith(':free')) {
                violations.push({
                    field,
                    message: `${field} must use an OpenRouter :free model while AI_REQUIRE_FREE_MODELS=true`
                })
            }
        }
    }

    return violations
}
