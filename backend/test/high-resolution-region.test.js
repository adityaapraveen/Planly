import test from 'node:test'
import assert from 'node:assert/strict'

import {
    buildPageRegionDefinitions,
    buildPdftoppmRegionArgs,
    HIGH_RESOLUTION_REGION_VERSION
} from '../src/services/high-resolution-region.service.js'

test('buildPageRegionDefinitions creates a bounded overlapping AEC region set', () => {
    const regions = buildPageRegionDefinitions({
        pageWidth: 1200,
        pageHeight: 800
    })

    assert.equal(regions.length, 7)
    assert.equal(regions.filter((region) => region.kind === 'GRID').length, 6)
    assert.equal(regions.filter((region) => region.kind === 'TITLE_BLOCK').length, 1)
    assert.equal(regions.every((region) => region.version === HIGH_RESOLUTION_REGION_VERSION), true)
    assert.equal(regions.every((region) =>
        region.x >= 0 && region.y >= 0 &&
        region.x + region.width <= 1.000001 &&
        region.y + region.height <= 1.000001
    ), true)
    assert.equal(regions.every((region) =>
        region.dpi >= 72 && region.dpi <= 400 &&
        region.crop.width > 0 && region.crop.height > 0
    ), true)

    const first = regions.find((region) => region.key === 'grid-r1-c1')
    const second = regions.find((region) => region.key === 'grid-r1-c2')
    assert.equal(first.x, 0)
    assert.equal(first.y, 0)
    assert.equal(first.x + first.width > second.x, true)

    const titleBlock = regions.find((region) => region.kind === 'TITLE_BLOCK')
    assert.deepEqual(
        [titleBlock.x, titleBlock.y, titleBlock.width, titleBlock.height],
        [0.62, 0.58, 0.38, 0.42]
    )
})

test('buildPdftoppmRegionArgs pins page, resolution, and crop geometry', () => {
    const region = {
        dpi: 240,
        crop: { x: 100, y: 200, width: 2048, height: 1536 }
    }
    const args = buildPdftoppmRegionArgs({
        pdfPath: 'uploads/drawings/example.pdf',
        pageNumber: 3,
        region,
        outputPrefix: 'uploads/rendered-regions/example'
    })

    assert.deepEqual(args, [
        '-f', '3',
        '-l', '3',
        '-png',
        '-singlefile',
        '-r', '240',
        '-x', '100',
        '-y', '200',
        '-W', '2048',
        '-H', '1536',
        'uploads/drawings/example.pdf',
        'uploads/rendered-regions/example'
    ])
})

test('buildPageRegionDefinitions rejects invalid page dimensions', () => {
    assert.throws(
        () => buildPageRegionDefinitions({ pageWidth: 0, pageHeight: 800 }),
        /positive finite numbers/
    )
})
