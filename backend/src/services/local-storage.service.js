import fs from 'fs/promises'
import path from 'path'
import { AppError } from '../utils/AppError.js'

const STORAGE_ROOT = path.resolve('uploads')

export const resolveStoredAsset = (assetPath) => {
    const resolvedPath = path.resolve(String(assetPath || ''))
    const isInsideStorage = resolvedPath === STORAGE_ROOT ||
        resolvedPath.startsWith(`${STORAGE_ROOT}${path.sep}`)

    if (!isInsideStorage) {
        throw new AppError('Invalid stored asset path', 500)
    }

    return resolvedPath
}

export const assertPdfFile = async (filePath) => {
    const handle = await fs.open(resolveStoredAsset(filePath), 'r')

    try {
        const header = Buffer.alloc(5)
        await handle.read(header, 0, header.length, 0)

        if (header.toString('ascii') !== '%PDF-') {
            throw new AppError('Uploaded file is not a valid PDF', 400)
        }
    } finally {
        await handle.close()
    }
}

export const deleteStoredAssets = async (assetPaths) => {
    const uniquePaths = [...new Set(assetPaths.filter(Boolean))]

    await Promise.all(uniquePaths.map(async (assetPath) => {
        try {
            await fs.unlink(resolveStoredAsset(assetPath))
        } catch (error) {
            if (error?.code !== 'ENOENT') throw error
        }
    }))
}
