import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: '#F9FAFB',
        padding: '60px 20px'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>🩺</div>
        <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#1F2937', marginBottom: '12px' }}>404</h1>
        <h2 style={{ fontSize: '24px', color: '#374151', marginBottom: '8px' }}>Page Not Found</h2>
        <p style={{ color: '#6B7280', marginBottom: '32px', maxWidth: '400px' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px', background: 'linear-gradient(135deg, #4F46E5, #4338CA)',
            color: 'white', borderRadius: '8px', fontWeight: '600', textDecoration: 'none'
          }}>
            ← Back to Home
          </Link>
          <Link to="/doctors" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px', background: 'white',
            color: '#4F46E5', borderRadius: '8px', fontWeight: '600',
            textDecoration: 'none', border: '2px solid #4F46E5'
          }}>
            Find a Doctor
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
