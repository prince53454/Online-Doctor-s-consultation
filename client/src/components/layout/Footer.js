import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="url(#grad2)" />
                <path d="M16 8v16M8 16h16" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="grad2" x1="0" y1="0" x2="32" y2="32">
                    <stop stopColor="#4F46E5"/>
                    <stop offset="1" stopColor="#7C3AED"/>
                  </linearGradient>
                </defs>
              </svg>
              <span>MediConnect</span>
            </Link>
            <p className="footer-desc">
              Your trusted healthcare platform. Connect with top doctors, book appointments,
              and access quality healthcare from anywhere.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">𝕏</a>
              <a href="#" className="social-link">in</a>
              <a href="#" className="social-link">f</a>
              <a href="#" className="social-link">▶</a>
            </div>
          </div>

          <div className="footer-links">
            <h4>Quick Links</h4>
            <Link to="/doctors">Find Doctors</Link>
            <Link to="/ai-checker">AI Symptom Checker</Link>
            <Link to="/labs">Lab Tests</Link>
            <Link to="/pharmacy">Online Pharmacy</Link>
            <Link to="/about">About Us</Link>
          </div>

          <div className="footer-links">
            <h4>Specialties</h4>
            <Link to="/doctors?specialization=Cardiologist">Cardiology</Link>
            <Link to="/doctors?specialization=Dermatologist">Dermatology</Link>
            <Link to="/doctors?specialization=Pediatrician">Pediatrics</Link>
            <Link to="/doctors?specialization=Neurologist">Neurology</Link>
          </div>

          <div className="footer-links">
            <h4>Contact Us</h4>
            <Link to="/contact">📍 Contact Page</Link>
            <p>📞 +91 1800-123-4567</p>
            <p>✉️ support@mediconnect.com</p>
            <p>🕐 24/7 Available</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} MediConnect Pro. All rights reserved.</p>
          <div className="footer-legal">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/about">About MediConnect</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
