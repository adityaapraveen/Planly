import test from 'node:test'
import assert from 'node:assert/strict'

import {
    deduplicateOcrWords,
    parseTesseractTsv,
    RASTER_OCR_VERSION
} from '../src/services/raster-ocr.service.js'

const header = 'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext'
const region = {
    id: 'region-1',
    key: 'grid-r1-c2',
    x: 0.5,
    y: 0.25,
    width: 0.5,
    height: 0.5,
    pixelWidth: 1000,
    pixelHeight: 500
}

test('parseTesseractTsv maps local word boxes to full-page coordinates', () => {
    const words = parseTesseractTsv({
        tsv: [
            header,
            '5\t1\t1\t1\t1\t1\t100\t50\t200\t40\t92.5\tA101',
            '5\t1\t1\t1\t1\t2\t350\t50\t100\t40\t20\tnoise',
            '4\t1\t1\t1\t1\t0\t0\t0\t0\t0\t-1\t'
        ].join('\n'),
        region,
        minimumConfidence: 35
    })

    assert.equal(RASTER_OCR_VERSION, 'tesseract-regions-v1')
    assert.equal(words.length, 1)
    assert.equal(words[0].text, 'A101')
    assert.equal(words[0].confidence, 0.925)
    assert.deepEqual(words[0].normalizedBounds, {
        x: 0.55,
        y: 0.3,
        width: 0.1,
        height: 0.04
    })
})

test('deduplicateOcrWords retains the strongest overlapping detection', () => {
    const words = deduplicateOcrWords([
        {
            text: 'MH-01',
            confidence: 0.75,
            normalizedBounds: { x: 0.2, y: 0.3, width: 0.1, height: 0.05 }
        },
        {
            text: 'mh-01',
            confidence: 0.94,
            normalizedBounds: { x: 0.205, y: 0.3, width: 0.1, height: 0.05 }
        },
        {
            text: 'INV',
            confidence: 0.8,
            normalizedBounds: { x: 0.4, y: 0.3, width: 0.05, height: 0.05 }
        }
    ])

    assert.equal(words.length, 2)
    assert.equal(words.find((word) => word.text.toLowerCase() === 'mh-01').confidence, 0.94)
    assert.equal(words.some((word) => word.text === 'INV'), true)
})

test('parseTesseractTsv rejects regions without pixel dimensions', () => {
    assert.throws(() => parseTesseractTsv({
        tsv: header,
        region: { ...region, pixelWidth: 0 },
        minimumConfidence: 35
    }), /dimensions are required/)
})
