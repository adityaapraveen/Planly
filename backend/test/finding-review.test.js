import test from 'node:test'
import assert from 'node:assert/strict'
import { buildFindingReviewChange } from '../src/services/finding-review.js'

const issue = {
    status: 'OPEN',
    reviewReason: null,
    reviewerNote: null
}

test('finding review requires a reason when dismissing AI output', () => {
    assert.throws(
        () => buildFindingReviewChange({ issue, status: 'DISMISSED' }),
        /dismissal reason is required/i
    )
})

test('finding review normalizes rationale and preserves an audit transition', () => {
    const result = buildFindingReviewChange({
        issue,
        status: 'DISMISSED',
        reason: '  Not applicable to this project phase  ',
        note: '  Confirmed with the project architect.  '
    })

    assert.equal(result.issueUpdate.status, 'DISMISSED')
    assert.equal(result.issueUpdate.reviewReason, 'Not applicable to this project phase')
    assert.equal(result.issueUpdate.reviewerNote, 'Confirmed with the project architect.')
    assert.equal(result.event.previousStatus, 'OPEN')
    assert.equal(result.event.status, 'DISMISSED')
    assert.ok(result.issueUpdate.reviewedAt instanceof Date)
})

test('reopening clears terminal rationale but retains the reviewer note', () => {
    const result = buildFindingReviewChange({
        issue: {
            status: 'RESOLVED',
            reviewReason: 'Corrected in revision',
            reviewerNote: null
        },
        status: 'OPEN',
        note: 'Regression requires another review.'
    })

    assert.equal(result.issueUpdate.reviewReason, null)
    assert.equal(result.issueUpdate.reviewerNote, 'Regression requires another review.')
    assert.equal(result.event.previousStatus, 'RESOLVED')
})
