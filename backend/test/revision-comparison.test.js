import test from 'node:test'
import assert from 'node:assert/strict'

import {
    buildRevisionComparison,
    compareFindings,
    compareSheets
} from '../src/services/revision-comparison.js'

const page = (id, pageNumber, sheetNumber, overrides = {}) => ({
    id,
    pageNumber,
    imageUrl: `/page-${pageNumber}.png`,
    sheet: {
        id: `sheet-${id}`,
        sheetNumber,
        title: overrides.title || 'Floor plan',
        discipline: overrides.discipline || 'Architecture',
        revision: overrides.revision || 'P1',
        issueDate: overrides.issueDate || '2026-08-01',
        reviewStatus: 'CONFIRMED',
        confidence: 0.95
    }
})

const issue = (id, title, pageNumber, overrides = {}) => ({
    id,
    title,
    category: overrides.category || 'Coordination',
    severity: overrides.severity || 'MEDIUM',
    confidence: 0.88,
    page: pageNumber,
    status: 'OPEN',
    explanation: 'Evidence-backed explanation',
    recommendation: 'Review the cited source',
    x: 0.1,
    y: 0.2,
    width: 0.2,
    height: 0.1,
    hasLocation: true
})

test('compareSheets reports added, removed, modified, and unchanged sheets', () => {
    const result = compareSheets({
        previousPages: [
            page('old-a101', 1, 'A-101'),
            page('old-a201', 2, 'A-201'),
            page('old-a301', 3, 'A-301')
        ],
        currentPages: [
            page('new-a101', 1, 'a 101'),
            page('new-a201', 2, 'A-201', { revision: 'P2' }),
            page('new-a401', 3, 'A-401')
        ]
    })

    assert.deepEqual(result.summary, {
        added: 1,
        removed: 1,
        modified: 1,
        unchanged: 1
    })
    const modified = result.changes.find((change) => change.status === 'MODIFIED')
    assert.deepEqual(modified.changedFields, [{
        field: 'revision',
        previous: 'P1',
        current: 'P2'
    }])
})

test('compareFindings distinguishes new, resolved, and persisting findings', () => {
    const previousPages = [page('old-a101', 1, 'A-101')]
    const currentPages = [page('new-a101', 1, 'A101')]
    const result = compareFindings({
        previousPages,
        currentPages,
        previousIssues: [
            issue('old-persisting', 'Door tag missing', 1),
            issue('old-resolved', 'Dimension conflict', 1)
        ],
        currentIssues: [
            issue('new-persisting', 'Door tag missing', 1),
            issue('new-finding', 'Head detail unresolved', 1)
        ]
    })

    assert.deepEqual(result.summary, { new: 1, resolved: 1, persisting: 1 })
})

test('buildRevisionComparison exposes method limits and processing state', () => {
    const comparison = buildRevisionComparison({
        previous: {
            id: 'old',
            fileName: 'issue-p1.pdf',
            status: 'COMPLETED',
            createdAt: new Date('2026-08-01'),
            pages: [page('old-a101', 1, 'A-101')],
            analyses: [{ status: 'COMPLETED', issues: [] }]
        },
        current: {
            id: 'new',
            fileName: 'issue-p2.pdf',
            status: 'PROCESSING',
            createdAt: new Date('2026-08-16'),
            pages: [],
            analyses: [{ status: 'PROCESSING', issues: [] }]
        }
    })

    assert.equal(comparison.status, 'PROCESSING')
    assert.equal(comparison.findings.status, 'PROCESSING')
    assert.match(comparison.method.limitation, /does not yet claim pixel-level/)
})
