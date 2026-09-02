import fs from 'fs/promises'

import { getDocument, Util } from 'pdfjs-dist/legacy/build/pdf.mjs'

import { prisma } from '../config/prisma.js'

export const NATIVE_PDF_EXTRACTION_VERSION = 'native-pdf-v1'

const MAX_TEXT_ITEMS_PER_PAGE = 20_000
const MAX_TEXT_CHARS_PER_PAGE = 2_000_000

const clamp01 = (value) => Math.max(0, Math.min(1, value))
const finiteNumber = (value, fallback = 0) =>
    Number.isFinite(Number(value)) ? Number(value) : fallback
const round = (value, precision = 4) => {
    const factor = 10 ** precision
    return Math.round(finiteNumber(value) * factor) / factor
}

const normalizeBounds = (bounds, pageWidth, pageHeight) => {
    const left = clamp01(bounds.x / pageWidth)
    const top = clamp01(bounds.y / pageHeight)
    const right = clamp01((bounds.x + bounds.width) / pageWidth)
    const bottom = clamp01((bounds.y + bounds.height) / pageHeight)

    return {
        x: round(left, 6),
        y: round(top, 6),
        width: round(Math.max(0, right - left), 6),
        height: round(Math.max(0, bottom - top), 6)
    }
}

const axisAlignedTextBounds = ({ item, style, viewport }) => {
    const transform = Util.transform(viewport.transform, item.transform)
    const [a, b, c, d, originX, originY] = transform
    const horizontalLength = Math.hypot(a, b) || 1
    const width = Math.max(0, finiteNumber(item.width) * viewport.scale)
    const advanceX = (a / horizontalLength) * width
    const advanceY = (b / horizontalLength) * width

    const ascent = Number.isFinite(style?.ascent) ? style.ascent : 1
    const descent = Number.isFinite(style?.descent) ? style.descent : 0
    const corners = [
        [originX + (c * ascent), originY + (d * ascent)],
        [originX + advanceX + (c * ascent), originY + advanceY + (d * ascent)],
        [originX + (c * descent), originY + (d * descent)],
        [originX + advanceX + (c * descent), originY + advanceY + (d * descent)]
    ]
    const xs = corners.map(([x]) => x)
    const ys = corners.map(([, y]) => y)
    const left = Math.min(...xs)
    const top = Math.min(...ys)
    const right = Math.max(...xs)
    const bottom = Math.max(...ys)

    return {
        x: left,
        y: top,
        width: Math.max(0, right - left),
        height: Math.max(0, bottom - top)
    }
}

const joinTextItems = (items) => {
    let text = ''

    for (const item of items) {
        if (!item.text) continue
        if (text && !text.endsWith('\n') && !/^\s/.test(item.text)) {
            text += ' '
        }
        text += item.text
        if (item.hasEOL && !text.endsWith('\n')) text += '\n'
        if (text.length >= MAX_TEXT_CHARS_PER_PAGE) {
            return text.slice(0, MAX_TEXT_CHARS_PER_PAGE)
        }
    }

    return text.trim()
}

export const buildNativePageArtifact = ({ pageNumber, viewport, textContent }) => {
    const pageWidth = finiteNumber(viewport.width)
    const pageHeight = finiteNumber(viewport.height)
    if (pageWidth <= 0 || pageHeight <= 0) {
        throw new Error(`PDF page ${pageNumber} has invalid dimensions`)
    }

    const sourceItems = textContent.items.filter((item) => 'str' in item)
    const truncated = sourceItems.length > MAX_TEXT_ITEMS_PER_PAGE
    const selectedItems = sourceItems.slice(0, MAX_TEXT_ITEMS_PER_PAGE)
    const items = selectedItems.map((item, index) => {
        const bounds = axisAlignedTextBounds({
            item,
            style: textContent.styles?.[item.fontName],
            viewport
        })

        return {
            index,
            text: String(item.str || ''),
            direction: item.dir || null,
            fontName: item.fontName || null,
            hasEOL: Boolean(item.hasEOL),
            bounds: {
                x: round(bounds.x),
                y: round(bounds.y),
                width: round(bounds.width),
                height: round(bounds.height)
            },
            normalizedBounds: normalizeBounds(bounds, pageWidth, pageHeight)
        }
    })
    const text = joinTextItems(items)
    const textTruncated = text.length >= MAX_TEXT_CHARS_PER_PAGE

    return {
        version: NATIVE_PDF_EXTRACTION_VERSION,
        parser: 'pdfjs-dist',
        pageNumber,
        page: {
            width: round(pageWidth),
            height: round(pageHeight),
            rotation: finiteNumber(viewport.rotation)
        },
        text,
        items,
        stats: {
            sourceTextItemCount: sourceItems.length,
            persistedTextItemCount: items.length,
            textCharacterCount: text.length,
            truncated: truncated || textTruncated
        }
    }
}

export const extractNativePdfArtifacts = async ({ pdfPath, pageNumbers }) => {
    const data = new Uint8Array(await fs.readFile(pdfPath))
    const loadingTask = getDocument({ data, useSystemFonts: true })
    const document = await loadingTask.promise

    try {
        const requestedPages = pageNumbers?.length
            ? [...new Set(pageNumbers)].sort((left, right) => left - right)
            : Array.from({ length: document.numPages }, (_, index) => index + 1)
        const artifacts = []

        for (const pageNumber of requestedPages) {
            if (pageNumber < 1 || pageNumber > document.numPages) continue

            const page = await document.getPage(pageNumber)
            try {
                const viewport = page.getViewport({ scale: 1 })
                const textContent = await page.getTextContent({
                    includeMarkedContent: false,
                    disableNormalization: false
                })
                artifacts.push(buildNativePageArtifact({
                    pageNumber,
                    viewport,
                    textContent
                }))
            } finally {
                page.cleanup()
            }
        }

        return artifacts
    } finally {
        await document.destroy()
    }
}

const extractionData = (artifact) => {
    const { text, ...nativeArtifacts } = artifact
    return {
        nativeText: text || null,
        nativeArtifacts,
        nativeExtractionStatus: artifact.items.length > 0 ? 'AVAILABLE' : 'NO_TEXT',
        nativeExtractionVersion: NATIVE_PDF_EXTRACTION_VERSION,
        nativeExtractionError: null,
        nativeExtractedAt: new Date()
    }
}

export const ensureNativePdfArtifacts = async ({ pdfPath, pages }) => {
    const stalePages = pages.filter((page) =>
        page.nativeExtractionVersion !== NATIVE_PDF_EXTRACTION_VERSION ||
        !['AVAILABLE', 'NO_TEXT'].includes(page.nativeExtractionStatus)
    )
    if (stalePages.length === 0) return pages

    try {
        const artifacts = await extractNativePdfArtifacts({
            pdfPath,
            pageNumbers: stalePages.map((page) => page.pageNumber)
        })
        const artifactsByPage = new Map(artifacts.map((artifact) => [
            artifact.pageNumber,
            artifact
        ]))

        await prisma.$transaction(stalePages.map((page) => {
            const artifact = artifactsByPage.get(page.pageNumber)
            const data = artifact
                ? extractionData(artifact)
                : {
                    nativeText: null,
                    nativeArtifacts: null,
                    nativeExtractionStatus: 'FAILED',
                    nativeExtractionVersion: NATIVE_PDF_EXTRACTION_VERSION,
                    nativeExtractionError: 'The PDF parser did not return this page',
                    nativeExtractedAt: new Date()
                }
            return prisma.drawingPage.update({ where: { id: page.id }, data })
        }))
    } catch {
        await prisma.$transaction(stalePages.map((page) =>
            prisma.drawingPage.update({
                where: { id: page.id },
                data: {
                    nativeExtractionStatus: 'FAILED',
                    nativeExtractionVersion: NATIVE_PDF_EXTRACTION_VERSION,
                    nativeExtractionError: 'Native PDF extraction failed; vision fallback remains available',
                    nativeExtractedAt: new Date()
                }
            })
        ))
    }

    return prisma.drawingPage.findMany({
        where: { id: { in: pages.map((page) => page.id) } },
        orderBy: { pageNumber: 'asc' }
    })
}
