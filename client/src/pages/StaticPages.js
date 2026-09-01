import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './StaticPages.css';

// ═══ ABOUT US ═══════════════════════════════
export function AboutPage() {
  return (
    <div className="static-page">
      <div className="static-hero about-hero">
        <div className="container">
          <h1>About MediConnect Pro</h1>
          <p>India's most trusted healthcare platform connecting patients with top doctors</p>
        </div>
      </div>
      <div className="container static-content">
        <div className="about-mission">
          <div className="about-mission-text">
            <h2>Our Mission</h2>
            <p>To make quality healthcare accessible, affordable, and convenient for every Indian. We believe that geography should never be a barrier to receiving excellent medical care.</p>
            <p>MediConnect Pro bridges the gap between patients and healthcare providers through technology, enabling video consultations, chat-based medical advice, AI-powered symptom analysis, and seamless appointment booking — all from the comfort of your home.</p>
          </div>
          <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop" alt="Our Mission" className="about-img" />
        </div>

        <div className="about-stats-row">
          <div className="about-stat"><h3>50,000+</h3><p>Doctors Registered</p></div>
          <div className="about-stat"><h3>2M+</h3><p>Patients Served</p></div>
          <div className="about-stat"><h3>100+</h3><p>Cities Covered</p></div>
          <div className="about-stat"><h3>4.8/5</h3><p>Average Rating</p></div>
        </div>

        <div className="about-values">
          <h2>Why Choose MediConnect?</h2>
          <div className="values-grid">
            <div className="value-card"><span className="value-icon">🔒</span><h3>Secure & Private</h3><p>HIPAA-compliant platform with end-to-end encryption for all consultations and medical records.</p></div>
            <div className="value-card"><span className="value-icon">🤖</span><h3>AI-Powered</h3><p>Advanced symptom checker helps you find the right specialist before your appointment.</p></div>
            <div className="value-card"><span className="value-icon">📹</span><h3>Video Consultations</h3><p>HD video calls with doctors from anywhere. No travel, no waiting rooms.</p></div>
            <div className="value-card"><span className="value-icon">💊</span><h3>Online Pharmacy</h3><p>Order genuine medicines delivered to your doorstep in 2-4 hours.</p></div>
            <div className="value-card"><span className="value-icon">🔬</span><h3>Lab Tests</h3><p>Book lab tests from accredited diagnostic centers with home sample collection.</p></div>
            <div className="value-card"><span className="value-icon">📋</span><h3>Medical Records</h3><p>Store all your prescriptions, reports, and health data in one secure place.</p></div>
          </div>
        </div>

        <div className="about-team">
          <h2>Our Team</h2>
          <p className="text-muted text-center mb-3">Founded by healthcare professionals and technology experts passionate about transforming Indian healthcare.</p>
          <div className="team-grid">
            {[
              { name: 'Dr. Arjun Kapoor', role: 'CEO & Co-Founder', img: 'https://ui-avatars.com/api/?name=Arjun+Kapoor&background=4F46E5&color=fff&size=200' },
              { name: 'Priya Sharma', role: 'CTO & Co-Founder', img: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=7C3AED&color=fff&size=200' },
              { name: 'Dr. Meera Patel', role: 'Chief Medical Officer', img: 'https://ui-avatars.com/api/?name=Meera+Patel&background=059669&color=fff&size=200' },
              { name: 'Rahul Gupta', role: 'Head of Product', img: 'https://ui-avatars.com/api/?name=Rahul+Gupta&background=F59E0B&color=fff&size=200' },
            ].map((member, i) => (
              <div key={i} className="team-card">
                <img src={member.img} alt={member.name} className="team-avatar" />
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ CONTACT US ═══════════════════════════════
export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="static-page">
      <div className="static-hero contact-hero">
        <div className="container"><h1>Contact Us</h1><p>We'd love to hear from you. Reach out anytime.</p></div>
      </div>
      <div className="container static-content">
        <div className="contact-grid">
          <div className="contact-info">
            <h2>Get in Touch</h2>
            <div className="contact-methods">
              <div className="contact-method"><span className="cm-icon">📞</span><div><h4>Phone</h4><p>+91 1800-123-4567 (Toll Free)</p><p>+91 11-4567-8900</p></div></div>
              <div className="contact-method"><span className="cm-icon">✉️</span><div><h4>Email</h4><p>support@mediconnect.com</p><p>doctors@mediconnect.com</p></div></div>
              <div className="contact-method"><span className="cm-icon">📍</span><div><h4>Office</h4><p>123 Healthcare Avenue, Connaught Place</p><p>New Delhi, India - 110001</p></div></div>
              <div className="contact-method"><span className="cm-icon">🕐</span><div><h4>Support Hours</h4><p>24/7 Customer Support</p><p>Mon-Sat: 9AM - 6PM (Office)</p></div></div>
            </div>
          </div>
          <div className="contact-form-card">
            {submitted ? (
              <div className="contact-success"><span>✅</span><h3>Message Sent!</h3><p>Thank you for reaching out. We'll get back to you within 24 hours.</p></div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2>Send us a Message</h2>
                <div className="form-row"><div className="form-group"><label className="form-label">Name *</label><input className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div><div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-input" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div></div>
                <div className="form-group"><label className="form-label">Subject *</label><select className="form-input" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required><option value="">Select...</option><option>General Inquiry</option><option>Technical Support</option><option>Billing Question</option><option>Doctor Registration</option><option>Partnership</option><option>Report a Bug</option></select></div>
                <div className="form-group"><label className="form-label">Message *</label><textarea className="form-textarea" rows={5} required value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="How can we help?" /></div>
                <button type="submit" className="btn btn-primary btn-lg">Send Message</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ PRIVACY POLICY ═══════════════════════════════
export function PrivacyPage() {
  return (
    <div className="static-page">
      <div className="static-hero privacy-hero"><div className="container"><h1>Privacy Policy</h1><p>Last updated: September 1, 2026</p></div></div>
      <div className="container static-content legal-content">
        <div className="legal-toc"><h3>Table of Contents</h3><ol><li><a href="#info">Information We Collect</a></li><li><a href="#use">How We Use Your Information</a></li><li><a href="#share">Information Sharing</a></li><li><a href="#security">Data Security</a></li><li><a href="#rights">Your Rights</a></li><li><a href="#cookies">Cookies</a></li><li><a href="#contact">Contact Us</a></li></ol></div>
        <section id="info"><h2>1. Information We Collect</h2><p>We collect information you provide directly: name, email, phone number, medical history, symptoms, and payment information. We also collect device information, IP address, and usage data through cookies and analytics.</p><p><strong>Health Information:</strong> Medical records, prescriptions, consultation notes, and health metrics you choose to store on our platform are encrypted and stored in compliance with applicable healthcare regulations.</p></section>
        <section id="use"><h2>2. How We Use Your Information</h2><ul><li>To provide and improve our healthcare services</li><li>To connect you with doctors and process appointments</li><li>To send appointment reminders and health notifications</li><li>To process payments and generate invoices</li><li>To improve our AI symptom checker accuracy</li><li>To comply with legal obligations</li></ul></section>
        <section id="share"><h2>3. Information Sharing</h2><p>We share your information only with: (a) Doctors you book appointments with (limited to consultation details), (b) Payment processors for transaction processing, (c) Legal authorities when required by law. We never sell your personal data to third parties.</p></section>
        <section id="security"><h2>4. Data Security</h2><p>We use industry-standard encryption (AES-256), secure servers, and regular security audits. Medical data is stored in HIPAA-compliant environments with strict access controls.</p></section>
        <section id="rights"><h2>5. Your Rights</h2><p>You have the right to: access your data, correct inaccurate data, delete your account and data, export your medical records, and opt out of non-essential communications.</p></section>
        <section id="cookies"><h2>6. Cookies</h2><p>We use essential cookies for authentication and functionality, analytics cookies to improve our service, and preference cookies to remember your settings. You can manage cookie preferences in your browser.</p></section>
        <section id="contact"><h2>7. Contact Us</h2><p>For privacy-related questions, email <strong>privacy@mediconnect.com</strong> or write to our Data Protection Officer at the address listed on our Contact page.</p></section>
      </div>
    </div>
  );
}

// ═══ TERMS OF SERVICE ═══════════════════════════════
export function TermsPage() {
  return (
    <div className="static-page">
      <div className="static-hero terms-hero"><div className="container"><h1>Terms of Service</h1><p>Last updated: September 1, 2026</p></div></div>
      <div className="container static-content legal-content">
        <div className="legal-toc"><h3>Table of Contents</h3><ol><li><a href="#acceptance">Acceptance of Terms</a></li><li><a href="#services">Our Services</a></li><li><a href="#accounts">User Accounts</a></li><li><a href="#medical">Medical Disclaimer</a></li><li><a href="#payments">Payments & Refunds</a></li><li><a href="#conduct">User Conduct</a></li><li><a href="#liability">Limitation of Liability</a></li></ol></div>
        <section id="acceptance"><h2>1. Acceptance of Terms</h2><p>By using MediConnect Pro, you agree to these Terms of Service. If you do not agree, please do not use our platform.</p></section>
        <section id="services"><h2>2. Our Services</h2><p>MediConnect Pro provides a technology platform connecting patients with healthcare providers. We facilitate appointments, video consultations, chat-based consultations, online pharmacy, and lab test bookings. We are not a healthcare provider and do not provide medical advice directly.</p></section>
        <section id="accounts"><h2>3. User Accounts</h2><p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate and complete information during registration. One person may not maintain multiple accounts.</p></section>
        <section id="medical"><h2>4. Medical Disclaimer</h2><p><strong>Important:</strong> Consultations through MediConnect Pro are not a substitute for in-person medical care. In case of emergency, always call your local emergency number (108 in India) or visit the nearest hospital. Our AI Symptom Checker provides guidance only and should not be used for self-diagnosis.</p></section>
        <section id="payments"><h2>5. Payments & Refunds</h2><p>All payments are processed through secure third-party payment gateways. Refund policies: Full refund if cancelled 24+ hours before appointment; 50% refund for 12-24 hours; No refund within 12 hours. Pharmacy orders can be cancelled before dispatch.</p></section>
        <section id="conduct"><h2>6. User Conduct</h2><p>Users must not: harass healthcare providers, share inappropriate content, attempt to circumvent platform fees, provide false medical information, or use the platform for any illegal purpose.</p></section>
        <section id="liability"><h2>7. Limitation of Liability</h2><p>MediConnect Pro shall not be liable for any indirect, incidental, or consequential damages. Our total liability shall not exceed the amount paid by you for the specific service in question.</p></section>
      </div>
    </div>
  );
}
