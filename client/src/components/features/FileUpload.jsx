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
        tabIndex={-1}
      />
      <div className="file-upload-icon">
        <Upload size={22} />
      </div>
      <h4>Drop a PDF drawing here, or click to browse</h4>
      <p>PDF files up to 20MB</p>
      {selectedFile && (
        <div className="file-upload-selected">
          <FileCheck size={14} />
          {selectedFile.name}
        </div>
      )}
    </div>
  )
}
