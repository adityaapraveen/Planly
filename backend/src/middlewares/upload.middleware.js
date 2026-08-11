import multer from 'multer'
import path from 'path'
import crypto from 'crypto'

export const MAX_DRAWING_SIZE_BYTES = 20 * 1024 * 1024

const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, 'uploads/drawings')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(8).toString('hex')

        cb(null, `${Date.now()}-${uniqueSuffix}.pdf`)
    }
})

const fileFilter = (req, file, cb) => {
    if(file.mimetype !== 'application/pdf') {
        return cb(
            new Error('Only PDF files are allowed'),
            false
        )
    }
    cb(null, true)
}

export const uploadDrawing = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_DRAWING_SIZE_BYTES
    }
})
