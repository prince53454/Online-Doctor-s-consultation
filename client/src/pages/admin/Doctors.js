import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';
import './AdminTabs.css';

function getSafeDocumentUrl(value) {
  try {
    const parsed = new URL(value, window.location.origin);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

export default function AdminDoctors() {
  const { user, logout, loading: authLoading } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState('pending');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [actionDoctorId, setActionDoctorId] = useState(null);

  const fetchDoctors = useCallback(async () => {
    setLoadError('');
    try {
      const [allRes, pendingRes] = await Promise.all([
        api.get('/admin/doctors?limit=50'),
        api.get('/admin/doctors/pending')
      ]);
      setDoctors(allRes.data.doctors || []);
      setPendingDoctors(pendingRes.data.doctors || []);
    } catch (error) {
      console.error(error);
      setLoadError(error.response?.data?.error || 'Doctor records could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (!authLoading) fetchDoctors(); }, [authLoading, fetchDoctors]);
  useEffect(() => {
    if (!authLoading && notifications[0]?._id) fetchDoctors();
  }, [authLoading, fetchDoctors, notifications[0]?._id]);
  useEffect(() => {
    if (!selectedDoctor) return undefined;
    const closeOnEscape = event => {
      if (event.key === 'Escape') setSelectedDoctor(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedDoctor]);

  const handleApprove = async (id, approved) => {
    setActionDoctorId(id);
    try {
      await api.put(`/admin/doctors/${id}/approve`, { approved });
      toast.success(approved ? 'Doctor approved and added to the directory.' : 'Doctor application rejected.');
      if (selectedDoctor?._id === id) {
        setSelectedDoctor(current => ({
          ...current,
          isApproved: approved,
          isRejected: !approved,
          isFeatured: approved ? current.isFeatured : false
        }));
      }
      await fetchDoctors();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not update doctor approval.');
    } finally {
      setActionDoctorId(null);
    }
  };

  const handleFeature = async (id) => {
    setActionDoctorId(id);
    try {
      const response = await api.put(`/admin/doctors/${id}/feature`);
      toast.success(response.data.doctor?.isFeatured
        ? 'Doctor is now featured in the patient directory.'
        : 'Doctor was removed from featured doctors.');
      if (selectedDoctor?._id === id) {
        setSelectedDoctor(current => ({ ...current, isFeatured: response.data.doctor.isFeatured }));
      }
      await fetchDoctors();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not update featured status.');
    } finally {
      setActionDoctorId(null);
    }
  };

  const approvedDoctors = doctors.filter(doc => doc.isApproved && !doc.isRejected);
  const rejectedDoctors = doctors.filter(doc => doc.isRejected);
  const displayed = tab === 'pending'
    ? pendingDoctors
    : tab === 'rejected'
      ? rejectedDoctors
      : approvedDoctors;
  const doctorStatus = doctor => doctor.isApproved
    ? 'Approved'
    : doctor.isRejected
      ? 'Rejected'
      : 'Pending review';

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span className="admin-logo-mark" aria-hidden="true">+</span>
          <div><h2>MediConnect</h2><span className="admin-logo-caption">PLATFORM ADMIN</span></div>
        </div>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-item">📊 Dashboard</Link>
          <Link to="/admin/doctors" className="admin-nav-item active">👨‍⚕️ Doctors</Link>
          <Link to="/admin/appointments" className="admin-nav-item">📅 Appointments</Link>
          <Link to="/admin/users" className="admin-nav-item">👥 Users</Link>
          <Link to="/admin/revenue" className="admin-nav-item">💰 Revenue</Link>
          <Link to="/admin/settings" className="admin-nav-item">⚙️ Settings</Link>
        </nav>
        <div className="admin-sidebar-footer">
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }}>Logout</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-header admin-header-page">
          <div className="admin-header-copy">
            <span className="admin-page-eyebrow">PROVIDER DIRECTORY</span>
            <h1>Manage Doctors</h1>
            <p>Review applications and manage the doctors available across your care network.</p>
          </div>
        </div>

        <div className="admin-tabs" role="tablist" aria-label="Doctor list">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'pending'}
            className={`admin-tab ${tab === 'pending' ? 'active' : ''}`}
            onClick={() => setTab('pending')}
          >
            Pending <span className="admin-filter-count">{pendingDoctors.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'all'}
            className={`admin-tab ${tab === 'all' ? 'active' : ''}`}
            onClick={() => setTab('all')}
          >
            All doctors <span className="admin-filter-count">{approvedDoctors.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'rejected'}
            className={`admin-tab ${tab === 'rejected' ? 'active' : ''}`}
            onClick={() => setTab('rejected')}
          >
            Rejected <span className="admin-filter-count">{rejectedDoctors.length}</span>
          </button>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : loadError ? (
          <div className="admin-card">
            <div className="admin-empty-state" role="alert">
              <span className="admin-empty-icon" aria-hidden="true">!</span>
              <h3>Could not load doctor records</h3>
              <p>{loadError}</p>
              <button className="btn btn-primary btn-sm" type="button" onClick={fetchDoctors}>Try again</button>
            </div>
          </div>
        ) : (
          <div className="admin-card">
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Specialization</th>
                    <th>City</th>
                    <th>Experience</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(doc => (
                    <tr key={doc._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={doc.user?.avatar || '/images/default-avatar.png'} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>{doc.user?.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{doc.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary">{doc.specialization}</span>
                        {doc.subSpecialization?.length > 0 && (
                          <small className="doctor-table-subtitle">{doc.subSpecialization.join(', ')}</small>
                        )}
                      </td>
                      <td>{doc.location?.city || 'N/A'}</td>
                      <td>{doc.experience} years</td>
                      <td>
                        <span className={`badge ${doc.isApproved ? 'badge-success' : doc.isRejected ? 'badge-error' : 'badge-warning'}`}>
                          {doctorStatus(doc)}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedDoctor(doc)}
                          >
                            View details
                          </button>
                          {!doc.isApproved && !doc.isRejected ? (
                            <>
                              <button type="button" className="btn btn-success btn-sm" disabled={actionDoctorId === doc._id} onClick={() => handleApprove(doc._id, true)}>✓ Approve</button>
                              <button type="button" className="btn btn-danger btn-sm" disabled={actionDoctorId === doc._id} onClick={() => handleApprove(doc._id, false)}>✗ Reject</button>
                            </>
                          ) : doc.isRejected ? (
                            <button type="button" className="btn btn-success btn-sm" disabled={actionDoctorId === doc._id} onClick={() => handleApprove(doc._id, true)}>Reconsider</button>
                          ) : (
                            <button type="button" className="btn btn-ghost btn-sm" disabled={actionDoctorId === doc._id} aria-pressed={Boolean(doc.isFeatured)} onClick={() => handleFeature(doc._id)}>
                              {doc.isFeatured ? '★ Remove feature' : '☆ Feature doctor'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {displayed.length === 0 && (
                    <tr><td colSpan="6">
                      <div className="admin-empty-state">
                        <span className="admin-empty-icon" aria-hidden="true">{tab === 'pending' ? '✓' : '⌕'}</span>
                        <h3>{tab === 'pending'
                          ? 'All applications are reviewed'
                          : tab === 'rejected'
                            ? 'No rejected applications'
                            : 'No approved doctors yet'}</h3>
                        <p>{tab === 'pending'
                          ? 'New doctor applications appear here with their profile and verification details for review.'
                          : tab === 'rejected'
                            ? 'Rejected applications remain available here if you need to review or reconsider them.'
                            : 'Approved doctor profiles will appear here and can be featured in the patient directory.'}</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      {selectedDoctor && (
        <div className="doctor-details-overlay" onMouseDown={event => {
          if (event.target === event.currentTarget) setSelectedDoctor(null);
        }}>
          <section
            className="doctor-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="doctor-details-title"
          >
            <header className="doctor-details-header">
              <div>
                <span className="admin-page-eyebrow">DOCTOR PROFILE</span>
                <h2 id="doctor-details-title">{selectedDoctor.user?.name || 'Doctor details'}</h2>
                <p>{selectedDoctor.specialization} · {doctorStatus(selectedDoctor)}</p>
              </div>
              <button type="button" className="doctor-details-close" aria-label="Close doctor details" onClick={() => setSelectedDoctor(null)}>×</button>
            </header>
            <div className="doctor-details-content">
              <section className="doctor-details-section">
                <h3>Contact &amp; practice</h3>
                <dl>
                  <div><dt>Email</dt><dd>{selectedDoctor.user?.email || 'Not provided'}</dd></div>
                  <div><dt>Phone</dt><dd>{selectedDoctor.user?.phone || 'Not provided'}</dd></div>
                  <div><dt>Clinic</dt><dd>{selectedDoctor.clinicName || 'Not provided'}</dd></div>
                  <div><dt>Location</dt><dd>{[selectedDoctor.location?.address, selectedDoctor.location?.city, selectedDoctor.location?.state, selectedDoctor.location?.pincode].filter(Boolean).join(', ') || 'Not provided'}</dd></div>
                  <div><dt>Experience</dt><dd>{selectedDoctor.experience ?? 'Not provided'} years</dd></div>
                  <div><dt>License number</dt><dd>{selectedDoctor.licenseNumber || 'Not provided'}</dd></div>
                </dl>
              </section>
              <section className="doctor-details-section">
                <h3>Consultation fees</h3>
                <dl>
                  <div><dt>In person</dt><dd>{selectedDoctor.consultationFee?.inPerson != null ? `₹${selectedDoctor.consultationFee.inPerson}` : 'Not provided'}</dd></div>
                  <div><dt>Video</dt><dd>{selectedDoctor.consultationFee?.video != null ? `₹${selectedDoctor.consultationFee.video}` : 'Not provided'}</dd></div>
                  <div><dt>Chat</dt><dd>{selectedDoctor.consultationFee?.chat != null ? `₹${selectedDoctor.consultationFee.chat}` : 'Not provided'}</dd></div>
                </dl>
              </section>
              <section className="doctor-details-section">
                <h3>Qualifications &amp; languages</h3>
                {selectedDoctor.qualification?.length ? (
                  <ul>{selectedDoctor.qualification.map((item, index) => (
                    <li key={`${item.degree}-${index}`}>{[item.degree, item.institution, item.year].filter(Boolean).join(' · ')}</li>
                  ))}</ul>
                ) : <p className="doctor-details-muted">No qualifications listed.</p>}
                <p>{[...(selectedDoctor.languages || []), ...(selectedDoctor.languagesKnown || [])].filter((value, index, values) => values.indexOf(value) === index).join(', ') || 'No languages listed.'}</p>
              </section>
              <section className="doctor-details-section">
                <h3>Availability</h3>
                {selectedDoctor.availability?.length ? (
                  <ul>{selectedDoctor.availability.map(day => (
                    <li key={day.day}>
                      <strong>{day.day || 'Day'}:</strong>{' '}
                      {day.slots?.filter(slot => slot.isAvailable).map(slot => `${slot.startTime}–${slot.endTime}`).join(', ') || 'No available slots'}
                    </li>
                  ))}</ul>
                ) : <p className="doctor-details-muted">No availability schedule provided.</p>}
              </section>
              <section className="doctor-details-section">
                <h3>About</h3>
                <p>{selectedDoctor.about || 'No profile summary provided.'}</p>
              </section>
              <section className="doctor-details-section">
                <h3>Verification documents</h3>
                {selectedDoctor.verificationDocuments?.length ? (
                  <ul>{selectedDoctor.verificationDocuments.map((documentUrl, index) => {
                    const safeUrl = getSafeDocumentUrl(documentUrl);
                    return (
                      <li key={`${documentUrl}-${index}`}>
                        {safeUrl
                          ? <a href={safeUrl} target="_blank" rel="noreferrer noopener">Open verification document {index + 1}</a>
                          : `Document ${index + 1} has an invalid link`}
                      </li>
                    );
                  })}</ul>
                ) : <p className="doctor-details-muted">No verification documents attached.</p>}
              </section>
            </div>
            <footer className="doctor-details-footer">
              {!selectedDoctor.isApproved && !selectedDoctor.isRejected && (
                <>
                  <button type="button" className="btn btn-danger btn-sm" disabled={actionDoctorId === selectedDoctor._id} onClick={() => handleApprove(selectedDoctor._id, false)}>Reject application</button>
                  <button type="button" className="btn btn-success btn-sm" disabled={actionDoctorId === selectedDoctor._id} onClick={() => handleApprove(selectedDoctor._id, true)}>Approve doctor</button>
                </>
              )}
              {selectedDoctor.isRejected && (
                <button type="button" className="btn btn-success btn-sm" disabled={actionDoctorId === selectedDoctor._id} onClick={() => handleApprove(selectedDoctor._id, true)}>Reconsider application</button>
              )}
              {selectedDoctor.isApproved && !selectedDoctor.isRejected && (
                <button type="button" className="btn btn-primary btn-sm" disabled={actionDoctorId === selectedDoctor._id} onClick={() => handleFeature(selectedDoctor._id)}>
                  {selectedDoctor.isFeatured ? 'Remove from featured' : 'Feature in patient directory'}
                </button>
              )}
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
