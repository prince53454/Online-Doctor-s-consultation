import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import toast from 'react-hot-toast';
import './DoctorRegister.css';

export default function DoctorPendingApproval() {
  const { user, logout, refreshUser } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    const latest = notifications[0];
    if (!latest || !['doctor_approved', 'doctor_rejected'].includes(latest.type)) return;
    refreshUser().then(updatedUser => {
      if (updatedUser.isApproved) {
        toast.success('Your doctor profile is approved.');
        navigate('/doctor/dashboard', { replace: true });
      } else if (latest.type === 'doctor_rejected') {
        toast.error(latest.message);
      }
    }).catch(error => {
      console.error('Failed to refresh doctor approval status:', error);
    });
  }, [notifications, refreshUser, navigate]);

  return (
    <div className="pending-page">
      <div className="pending-card">
        <div className="pending-icon">⏳</div>
        <h1>Profile Under Review</h1>
        <p>
          Thank you, <strong>{user?.name}</strong>! Your doctor profile has been submitted and is currently being reviewed by our admin team.
        </p>

        <div className="pending-steps">
          <h3>📋 What happens next?</h3>
          <ol>
            <li>Our team verifies your medical credentials and license</li>
            <li>We review your clinic details and experience</li>
            <li>Once approved, you'll get full access to the Doctor Dashboard</li>
            <li>You'll be able to receive patient bookings and consultations</li>
          </ol>
        </div>

        <p style={{fontSize:13,color:'var(--gray-500)',marginBottom:24}}>
          This usually takes <strong>24-48 hours</strong>. You'll be redirected to the Doctor Dashboard automatically once approved.
        </p>

        <div style={{display:'flex',flexDirection:'column',gap:10,alignItems:'center'}}>
          <button className="btn btn-primary" onClick={() => refreshUser().then(updatedUser => {
            if (updatedUser.isApproved) navigate('/doctor/dashboard', { replace: true });
          }).catch(error => {
            console.error('Failed to refresh doctor approval status:', error);
            toast.error('Could not refresh your approval status.');
          })}>🔄 Refresh Status</button>
          <Link to="/" className="btn btn-ghost">← Back to Home</Link>
          <button className="btn btn-ghost" style={{color:'var(--gray-400)',fontSize:12}} onClick={logout}>Logout</button>
        </div>
      </div>
    </div>
  );
}
