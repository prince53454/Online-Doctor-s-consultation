import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Reports.css';

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ title: '', description: '', fileType: 'other', tags: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const fetchReports = async () => {
    try {
      const params = filter ? `?type=${filter}` : '';
      const res = await api.get(`/reports${params}`);
      setReports(res.data.reports || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [filter]);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only images and documents (PDF, DOC) are allowed');
      return;
    }

    setSelectedFile(file);

    // Preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    // Auto-fill title from filename
    if (!form.title) {
      const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      setForm(prev => ({ ...prev, title: name }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile && !form.title) {
      toast.error('Please select a file or enter a title');
      return;
    }

    setUploading(true);
    try {
      if (selectedFile) {
        // Upload file via multipart form
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('fileType', form.fileType);
        formData.append('tags', form.tags);
        formData.append('folder', 'mediconnect/reports');

        await api.post('/reports', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Text-only report
        await api.post('/reports', {
          title: form.title,
          description: form.description,
          fileType: form.fileType,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
        });
      }

      toast.success('Report uploaded successfully');
      setShowUpload(false);
      resetForm();
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', description: '', fileType: 'other', tags: '' });
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await api.delete(`/reports/${id}`);
      toast.success('Report deleted');
      fetchReports();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="reports-page">
      <div className="container">
        <div className="flex-between mb-3">
          <div>
            <h1>Medical Reports</h1>
            <p className="text-muted">Manage and share your medical documents securely</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>+ Upload Report</button>
        </div>

        <div className="reports-filters">
          {[
            { value: '', label: 'All' },
            { value: 'lab-report', label: '🔬 Lab Reports' },
            { value: 'prescription', label: '💊 Prescriptions' },
            { value: 'imaging', label: '📷 Imaging' },
            { value: 'vaccination', label: '💉 Vaccination' },
            { value: 'other', label: '📄 Other' }
          ].map(type => (
            <button key={type.value} className={`filter-chip ${filter === type.value ? 'active' : ''}`}
              onClick={() => setFilter(type.value)}>
              {type.label}
            </button>
          ))}
        </div>

        {reports.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">📋</div>
            <h3>No reports found</h3>
            <p>Upload your first medical report to get started.</p>
          </div>
        ) : (
          <div className="reports-grid">
            {reports.map(report => (
              <div key={report._id} className="report-card card">
                <div className="card-body">
                  <div className="report-icon">
                    {report.fileType === 'lab-report' ? '🔬' :
                     report.fileType === 'prescription' ? '💊' :
                     report.fileType === 'imaging' ? '📷' :
                     report.fileType === 'vaccination' ? '💉' : '📄'}
                  </div>
                  <h3>{report.title}</h3>
                  <p className="text-sm text-muted">{report.description || 'No description'}</p>
                  <div className="report-meta">
                    <span className="badge badge-info">{report.fileType}</span>
                    <span className="text-sm text-muted">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {report.tags?.length > 0 && (
                    <div className="report-tags">
                      {report.tags.map(tag => (
                        <span key={tag} className="badge badge-primary">{tag}</span>
                      ))}
                    </div>
                  )}
                  {report.fileUrl && (
                    <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">🔗 View File</a>
                  )}
                  <div className="report-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(report._id)}>🗑️ Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {showUpload && (
          <div className="modal-overlay" onClick={() => { setShowUpload(false); resetForm(); }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Upload Report</h2>
                <button className="modal-close" onClick={() => { setShowUpload(false); resetForm(); }}>✕</button>
              </div>

              <form onSubmit={handleUpload}>
                {/* File Drop Zone */}
                <div
                  className={`drop-zone ${dragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    style={{ display: 'none' }}
                  />

                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="file-preview" />
                  ) : selectedFile ? (
                    <div className="file-selected">
                      <span className="file-icon">📄</span>
                      <span>{selectedFile.name}</span>
                      <span className="text-sm text-muted">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ) : (
                    <div className="drop-zone-content">
                      <span className="drop-icon">📁</span>
                      <p><strong>Click to upload</strong> or drag and drop</p>
                      <p className="text-sm text-muted">PDF, DOC, JPG, PNG (max 10MB)</p>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Report Title *</label>
                  <input className="form-input" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required placeholder="e.g., Blood Test Report" />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Brief description..." rows={3} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Report Type</label>
                    <select className="form-select" value={form.fileType} onChange={(e) => setForm({...form, fileType: e.target.value})}>
                      <option value="lab-report">Lab Report</option>
                      <option value="prescription">Prescription</option>
                      <option value="imaging">Imaging</option>
                      <option value="vaccination">Vaccination</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tags (comma-separated)</label>
                    <input className="form-input" value={form.tags} onChange={(e) => setForm({...form, tags: e.target.value})} placeholder="e.g., blood, diabetes" />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => { setShowUpload(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={uploading}>
                    {uploading ? '⏳ Uploading...' : '📤 Upload Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
