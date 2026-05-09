import multer from 'multer'
import path from 'path'
import crypto from 'crypto'

const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, 'uploads/drawings')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(8).toString('hex')

        const extension = path.extname(file.originalname)

        cb(null, `${Date.now()}-${uniqueSuffix}${extension}`)
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
        fileSize: 20 * 1024 * 1024
    }
})