import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DoctorRegister.css';

export default function DoctorPendingApproval() {
  const { user, logout } = useAuth();

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
          <button className="btn btn-primary" onClick={() => window.location.reload()}>🔄 Refresh Status</button>
          <Link to="/" className="btn btn-ghost">← Back to Home</Link>
          <button className="btn btn-ghost" style={{color:'var(--gray-400)',fontSize:12}} onClick={logout}>Logout</button>
        </div>
      </div>
    </div>
  );
}
