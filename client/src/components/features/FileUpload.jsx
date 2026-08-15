import { useState } from 'react'
import { Upload, FileCheck } from 'lucide-react'
import './FileUpload.css'

export function FileUpload({ onFileSelect, accept = '.pdf', uploading = false }) {
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => {
    setDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      onFileSelect(file)
    }
  }

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      onFileSelect(file)
    }
  }

  return (
    <div
      className={`file-upload ${dragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        aria-label="Choose PDF drawing"
      />
      <div className="file-upload-icon">
        <Upload size={22} />
      </div>
      <h4>{uploading ? 'Uploading drawing…' : 'Drop a PDF drawing here, or choose a file'}</h4>
      <p>PDF only · Maximum file size 20 MB</p>
      {selectedFile && (
        <div className="file-upload-selected">
          <FileCheck size={14} />
          {selectedFile.name}
        </div>
      )}
    </div>
  )
}
