import { execFile } from 'child_process'
import { promisify } from 'util'

import { config } from '../config/config.js'
import { prisma } from '../config/prisma.js'

export const RASTER_OCR_VERSION = 'tesseract-regions-v1'

const MAX_OCR_WORDS_PER_PAGE = 20_000
const MAX_OCR_TEXT_CHARS = 2_000_000
const execFileAsync = promisify(execFile)

const clamp01 = (value) => Math.max(0, Math.min(1, value))
const round = (value, precision = 6) => {
    const factor = 10 ** precision
    return Math.round(value * factor) / factor
}
const normalizedText = (value) => String(value || '')
    .trim()
    .toLocaleLowerCase('en-US')

const parseTsvNumber = (value) => {
    const number = Number(value)
    return Number.isFinite(number) ? number : null
}

const intersectionOverUnion = (left, right) => {
    const intersectionLeft = Math.max(left.x, right.x)
    const intersectionTop = Math.max(left.y, right.y)
    const intersectionRight = Math.min(left.x + left.width, right.x + right.width)
    const intersectionBottom = Math.min(left.y + left.height, right.y + right.height)
    const intersectionWidth = Math.max(0, intersectionRight - intersectionLeft)
    const intersectionHeight = Math.max(0, intersectionBottom - intersectionTop)
    const intersection = intersectionWidth * intersectionHeight
    const union = (left.width * left.height) + (right.width * right.height) - intersection
    return union > 0 ? intersection / union : 0
}

export const parseTesseractTsv = ({ tsv, region, minimumConfidence }) => {
    if (!region?.pixelWidth || !region?.pixelHeight) {
        throw new Error('OCR region dimensions are required')
    }

    const lines = String(tsv || '').split(/\r?\n/)
    const words = []
    for (let index = 1; index < lines.length; index += 1) {
        if (!lines[index].trim()) continue
        const columns = lines[index].split('\t')
        if (columns.length < 12 || columns[0] !== '5') continue

        const left = parseTsvNumber(columns[6])
        const top = parseTsvNumber(columns[7])
        const width = parseTsvNumber(columns[8])
        const height = parseTsvNumber(columns[9])
        const confidence = parseTsvNumber(columns[10])
        const text = columns.slice(11).join('\t').trim()
        if (!text || [left, top, width, height, confidence].includes(null) ||
            confidence < minimumConfidence || width <= 0 || height <= 0) {
            continue
        }

        const localX = clamp01(left / region.pixelWidth)
        const localY = clamp01(top / region.pixelHeight)
        const localRight = clamp01((left + width) / region.pixelWidth)
        const localBottom = clamp01((top + height) / region.pixelHeight)
        const normalizedBounds = {
            x: round(region.x + (localX * region.width)),
            y: round(region.y + (localY * region.height)),
            width: round(Math.max(0, localRight - localX) * region.width),
            height: round(Math.max(0, localBottom - localY) * region.height)
        }

        words.push({
            text,
            confidence: round(confidence / 100, 4),
            regionId: region.id,
            regionKey: region.key,
            lineKey: `${region.key}:${columns[2]}:${columns[3]}:${columns[4]}`,
            localBounds: {
                x: left,
                y: top,
                width,
                height
            },
            normalizedBounds
        })
    }
    return words
}

export const deduplicateOcrWords = (words) => {
    const sorted = [...words].sort((left, right) =>
        right.confidence - left.confidence
    )
    const accepted = []

    for (const candidate of sorted) {
        const duplicate = accepted.some((existing) =>
            normalizedText(existing.text) === normalizedText(candidate.text) &&
            intersectionOverUnion(
                existing.normalizedBounds,
                candidate.normalizedBounds
            ) >= 0.3
        )
        if (!duplicate) accepted.push(candidate)
        if (accepted.length >= MAX_OCR_WORDS_PER_PAGE) break
    }

    return accepted.sort((left, right) => {
        const verticalDifference = left.normalizedBounds.y - right.normalizedBounds.y
        if (Math.abs(verticalDifference) > 0.005) return verticalDifference
        return left.normalizedBounds.x - right.normalizedBounds.x
    })
}

const buildOcrText = (words) => {
    let text = ''
    let previousY = null

    for (const word of words) {
        const startsNewLine = previousY !== null &&
            Math.abs(word.normalizedBounds.y - previousY) > 0.008
        const separator = !text ? '' : startsNewLine ? '\n' : ' '
        if (text.length + separator.length + word.text.length > MAX_OCR_TEXT_CHARS) break
        text += `${separator}${word.text}`
        previousY = word.normalizedBounds.y
    }

    return text
}

export const runTesseractRegion = async ({ region }) => {
    const { stdout } = await execFileAsync('tesseract', [
        region.imagePath,
        'stdout',
        '-l', config.OCR_LANGUAGES,
        '--oem', '1',
        '--psm', '11',
        'tsv'
    ], {
        timeout: config.OCR_TIMEOUT_MS,
        maxBuffer: 50 * 1024 * 1024
    })

    return parseTesseractTsv({
        tsv: stdout,
        region,
        minimumConfidence: config.OCR_MIN_WORD_CONFIDENCE
    })
}

const updatePageOcr = async (page, data) => {
    await prisma.drawingPage.update({
        where: { id: page.id },
        data
    })
    return { ...page, ...data }
}

const skippedOcrData = (status) => ({
    ocrText: null,
    ocrArtifacts: null,
    ocrStatus: status,
    ocrVersion: RASTER_OCR_VERSION,
    ocrError: null,
    ocrExtractedAt: new Date()
})

export const ensureRasterOcr = async ({ pages }) => {
    const results = []

    for (const page of pages) {
        if (!config.OCR_ENABLED) {
            results.push(page.ocrStatus === 'DISABLED' &&
                page.ocrVersion === RASTER_OCR_VERSION
                ? page
                : await updatePageOcr(page, skippedOcrData('DISABLED')))
            continue
        }

        const nativeCharacterCount = String(page.nativeText || '')
            .replace(/\s/g, '').length
        if (page.nativeExtractionStatus === 'AVAILABLE' &&
            nativeCharacterCount >= config.OCR_MIN_NATIVE_CHARS) {
            results.push(page.ocrStatus === 'NOT_REQUIRED' &&
                page.ocrVersion === RASTER_OCR_VERSION
                ? page
                : await updatePageOcr(page, skippedOcrData('NOT_REQUIRED')))
            continue
        }

        if (['AVAILABLE', 'NO_TEXT'].includes(page.ocrStatus) &&
            page.ocrVersion === RASTER_OCR_VERSION) {
            results.push(page)
            continue
        }

        const gridRegions = (page.regions || []).filter((region) =>
            region.kind === 'GRID' && region.status === 'AVAILABLE' && region.imagePath
        )
        if (gridRegions.length === 0) {
            results.push(await updatePageOcr(page, {
                ocrStatus: 'FAILED',
                ocrVersion: RASTER_OCR_VERSION,
                ocrError: 'No high-resolution regions were available for OCR',
                ocrExtractedAt: new Date()
            }))
            continue
        }

        try {
            const regionWords = []
            for (const region of gridRegions) {
                regionWords.push(...await runTesseractRegion({ region }))
            }
            const words = deduplicateOcrWords(regionWords)
            const text = buildOcrText(words)
            const artifact = {
                version: RASTER_OCR_VERSION,
                engine: 'tesseract',
                languages: config.OCR_LANGUAGES,
                words,
                stats: {
                    attemptedRegionCount: gridRegions.length,
                    rawWordCount: regionWords.length,
                    wordCount: words.length,
                    textCharacterCount: text.length,
                    minimumWordConfidence: config.OCR_MIN_WORD_CONFIDENCE,
                    truncated: words.length >= MAX_OCR_WORDS_PER_PAGE ||
                        text.length >= MAX_OCR_TEXT_CHARS
                }
            }
            const data = {
                ocrText: text || null,
                ocrArtifacts: artifact,
                ocrStatus: words.length > 0 ? 'AVAILABLE' : 'NO_TEXT',
                ocrVersion: RASTER_OCR_VERSION,
                ocrError: null,
                ocrExtractedAt: new Date()
            }
            results.push(await updatePageOcr(page, data))
        } catch {
            results.push(await updatePageOcr(page, {
                ocrText: null,
                ocrArtifacts: null,
                ocrStatus: 'FAILED',
                ocrVersion: RASTER_OCR_VERSION,
                ocrError: 'Local raster OCR failed; vision fallback remains available',
                ocrExtractedAt: new Date()
            }))
        }
    }

    return results
}
