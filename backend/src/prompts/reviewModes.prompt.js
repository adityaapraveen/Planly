export const REVIEW_MODES = {
    SUBMISSION_READINESS: {
        label: 'Submission Readiness',
        focus: `
Focus on whether this drawing is ready for review/submission.

Check:
- title block completeness
- scale
- north arrow
- legend
- dimensions
- room labels
- door/window schedules
- drawing readability
- missing notes
- incomplete annotations
`
    },

    DOCUMENTATION_REVIEW: {
        label: 'Documentation Review',
        focus: `
Focus on drawing documentation quality.

Check:
- unclear annotations
- missing labels
- missing dimensions
- inconsistent symbols
- incomplete schedules
- missing general notes
- poor sheet organization
`
    },

    CONSTRUCTABILITY_REVIEW: {
        label: 'Constructability Review',
        focus: `
Focus on whether the drawing is clear enough for site execution.

Check:
- ambiguous construction details
- missing practical dimensions
- unclear wall/door/window positions
- execution ambiguity
- areas likely to cause contractor confusion
- missing installation or coordination notes
`
    },

    COORDINATION_REVIEW: {
        label: 'Coordination Review',
        focus: `
Focus on possible coordination risks between architecture, structure, MEP, plumbing, and site execution.

Check:
- unclear service zones
- risky openings
- possible consultant coordination gaps
- missing references to structural/MEP drawings
- areas where contractors may need clarification
`
    },

    COMPLIANCE_RISK_REVIEW: {
        label: 'Compliance Risk Review',
        focus: `
Focus only on possible compliance-sensitive risks.

Important:
- Do not claim exact legal/code violations unless clearly visible.
- Use language like "possible risk" or "requires verification".
- Focus on accessibility, circulation, ventilation, fire safety, exits, and minimum dimension clarity.
`
    }
}