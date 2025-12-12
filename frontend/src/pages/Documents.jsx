import React, { useEffect, useState } from 'react'
import api from '../api'  // make sure this path is correct (adjust if needed)

export default function Documents() {
  const [docs, setDocs] = useState([])
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)

  const load = () => {
    api.get('/documents')
      .then(res => setDocs(res.data))
      .catch(err => console.error('Error loading documents:', err))
  }

  const upload = async () => {
    if (!file) return alert('Choose file')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', title)
    await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    setTitle('')
    setFile(null)
    load()
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <div className="header"><h2>Documents</h2></div>

      <div className="card">
        <h4>Upload Document</h4>
        <div className="form-row">
          <label>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="form-row">
          <label>File</label>
          <input type="file" onChange={e => setFile(e.target.files[0])} />
        </div>
        <button className="btn" onClick={upload}>Upload</button>
      </div>

      <div className="card">
        <h4>All Documents</h4>
        <table className="table">
          <thead>
            <tr><th>Title</th><th>Uploaded</th><th>Link</th></tr>
          </thead>
          <tbody>
            {docs.map(d => (
              <tr key={d.document_id}>
                <td>{d.title}</td>
                <td>{new Date(d.upload_date).toLocaleString()}</td>
                <td><a href={`http://localhost:5000${d.file_url}`} target="_blank" rel="noreferrer">Open</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
