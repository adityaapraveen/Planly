import test from 'node:test'
import assert from 'node:assert/strict'

import {
    buildNativePageArtifact,
    NATIVE_PDF_EXTRACTION_VERSION
} from '../src/services/native-pdf-extraction.service.js'

const viewport = {
    width: 200,
    height: 100,
    rotation: 0,
    scale: 1,
    transform: [1, 0, 0, -1, 0, 100]
}

test('buildNativePageArtifact preserves text and page-space coordinates', () => {
    const artifact = buildNativePageArtifact({
        pageNumber: 2,
        viewport,
        textContent: {
            styles: {
                F1: { ascent: 0.8, descent: -0.2 }
            },
            items: [
                {
                    str: 'A101',
                    dir: 'ltr',
                    fontName: 'F1',
                    hasEOL: true,
                    width: 50,
                    transform: [10, 0, 0, 10, 20, 30]
                },
                {
                    str: 'FLOOR PLAN',
                    dir: 'ltr',
                    fontName: 'F1',
                    hasEOL: false,
                    width: 80,
                    transform: [10, 0, 0, 10, 20, 15]
                }
            ]
        }
    })

    assert.equal(artifact.version, NATIVE_PDF_EXTRACTION_VERSION)
    assert.equal(artifact.pageNumber, 2)
    assert.deepEqual(artifact.page, { width: 200, height: 100, rotation: 0 })
    assert.equal(artifact.text, 'A101\nFLOOR PLAN')
    assert.equal(artifact.stats.sourceTextItemCount, 2)
    assert.deepEqual(artifact.items[0].bounds, {
        x: 20,
        y: 62,
        width: 50,
        height: 10
    })
    assert.deepEqual(artifact.items[0].normalizedBounds, {
        x: 0.1,
        y: 0.62,
        width: 0.25,
        height: 0.1
    })
})

test('buildNativePageArtifact clips normalized bounds to the page', () => {
    const artifact = buildNativePageArtifact({
        pageNumber: 1,
        viewport,
        textContent: {
            styles: { F1: { ascent: 1, descent: 0 } },
            items: [{
                str: 'EDGE',
                fontName: 'F1',
                width: 40,
                transform: [10, 0, 0, 10, 190, 90]
            }]
        }
    })

    assert.deepEqual(artifact.items[0].normalizedBounds, {
        x: 0.95,
        y: 0,
        width: 0.05,
        height: 0.1
    })
})

test('buildNativePageArtifact rejects invalid page dimensions', () => {
    assert.throws(() => buildNativePageArtifact({
        pageNumber: 1,
        viewport: { ...viewport, width: 0 },
        textContent: { styles: {}, items: [] }
    }), /invalid dimensions/)
})
