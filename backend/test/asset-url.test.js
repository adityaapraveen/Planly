import test from 'node:test'
import assert from 'node:assert/strict'

import {
    createSignedAssetUrl,
    verifySignedAssetRequest
} from '../src/utils/asset-url.js'

test('signed asset URLs verify for the intended drawing and page', () => {
    const url = createSignedAssetUrl({
        drawingId: 'drawing-1',
        assetType: 'page',
        pageNumber: 2
    })
    const parsed = new URL(url, 'http://localhost')

    assert.doesNotThrow(() => verifySignedAssetRequest({
        drawingId: 'drawing-1',
        assetType: 'page',
        pageNumber: 2,
        expires: parsed.searchParams.get('expires'),
        signature: parsed.searchParams.get('signature')
    }))
})

test('signed region URLs bind the region identity', () => {
    const url = createSignedAssetUrl({
        drawingId: 'drawing-1',
        assetType: 'region',
        regionId: 'region-7'
    })
    const parsed = new URL(url, 'http://localhost')

    assert.equal(parsed.pathname, '/api/assets/drawings/drawing-1/regions/region-7')
    assert.doesNotThrow(() => verifySignedAssetRequest({
        drawingId: 'drawing-1',
        assetType: 'region',
        regionId: 'region-7',
        expires: parsed.searchParams.get('expires'),
        signature: parsed.searchParams.get('signature')
    }))
    assert.throws(() => verifySignedAssetRequest({
        drawingId: 'drawing-1',
        assetType: 'region',
        regionId: 'region-8',
        expires: parsed.searchParams.get('expires'),
        signature: parsed.searchParams.get('signature')
    }), /Invalid asset link/)
})

test('signed asset URLs reject tampered asset identity', () => {
    const url = createSignedAssetUrl({
        drawingId: 'drawing-1',
        assetType: 'drawing'
    })
    const parsed = new URL(url, 'http://localhost')

    assert.throws(() => verifySignedAssetRequest({
        drawingId: 'drawing-2',
        assetType: 'drawing',
        expires: parsed.searchParams.get('expires'),
        signature: parsed.searchParams.get('signature')
    }), /Invalid asset link/)
})
