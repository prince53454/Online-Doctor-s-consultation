import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './AISymptomChecker.css';

export default function AISymptomChecker() {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState('');
  const [city, setCity] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      toast.error('Please describe your symptoms');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/ai/recommend', {
        symptoms,
        city: city || undefined,
        maxFee: maxFee || undefined
      });
      setResult(res.data.analysis);
    } catch (error) {
      toast.error('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoBook = async (doctorId) => {
    if (!user) {
      toast.error('Please login to book an appointment');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/ai/auto-book', {
        doctorId,
        symptoms,
        appointmentType: 'in-person'
      });
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Auto-booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-page">
      <div className="container">
        <div className="ai-header">
          <div className="ai-icon-large">🤖</div>
          <h1>AI Symptom Checker</h1>
          <p>Describe your symptoms and our AI will recommend the right specialist for you</p>
        </div>

        <div className="ai-form-card">
          <form onSubmit={handleCheck}>
            <div className="form-group">
              <label className="form-label">Describe Your Symptoms *</label>
              <textarea
                className="form-textarea"
                placeholder="e.g., I have been experiencing severe headache for 3 days, along with sensitivity to light and nausea..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={4}
              />
            </div>

            <div className="ai-form-row">
              <div className="form-group">
                <label className="form-label">Your City (Optional)</label>
                <input className="form-input" placeholder="e.g., Delhi" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Budget (Optional)</label>
                <input className="form-input" type="number" placeholder="e.g., 500" value={maxFee} onChange={(e) => setMaxFee(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? '🔍 Analyzing Symptoms...' : '🔍 Analyze Symptoms'}
            </button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className="ai-results animate-fadeIn">
            {/* Urgency */}
            <div className={`urgency-banner ${result.urgency?.level}`}>
              {result.urgency?.level === 'emergency' && '🚨 '}
              {result.urgency?.level === 'urgent' && '⚠️ '}
              {result.urgency?.level === 'normal' && '✅ '}
              {result.urgency?.message}
            </div>

            {/* Analysis */}
            <div className="ai-analysis-card">
              <h3>Symptom Analysis</h3>
              <div className="analysis-grid">
                {result.symptomAnalysis?.map((analysis, i) => (
                  <div key={i} className="analysis-item">
                    <div className="analysis-keyword">"{analysis.keyword}"</div>
                    <div className="analysis-confidence">
                      <div className="confidence-bar">
                        <div className="confidence-fill" style={{ width: `${analysis.matchConfidence}%` }}></div>
                      </div>
                      <span>{analysis.matchConfidence}% match</span>
                    </div>
                    <div className="analysis-specialties">
                      {analysis.suggestedSpecialties?.map(s => (
                        <span key={s} className="badge badge-primary">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="recommended-specialties mt-2">
                <strong>Recommended Specialists:</strong>
                <div className="tag-list mt-1">
                  {result.recommendedSpecialties?.map(s => (
                    <span key={s} className="badge badge-success">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Doctor Recommendations */}
            {result.recommendations?.length > 0 && (
              <div className="ai-doctors-card">
                <h3>Recommended Doctors</h3>
                <div className="ai-doctors-list">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="ai-doctor-item">
                      <div className="ai-doctor-rank">#{i + 1}</div>
                      <img src={rec.doctor.user?.avatar} alt="" className="ai-doctor-avatar" />
                      <div className="ai-doctor-info">
                        <h4>{rec.doctor.user?.name}</h4>
                        <p>{rec.doctor.specialization} • ⭐ {(rec.doctor.rating?.average || 0).toFixed(1)}</p>
                        <p className="text-sm text-muted">{rec.reason}</p>
                        <div className="ai-doctor-score">
                          Match: <strong>{rec.matchScore}%</strong>
                        </div>
                      </div>
                      <div className="ai-doctor-actions">
                        <Link to={`/doctors/${rec.doctor._id}`} className="btn btn-secondary btn-sm">View Profile</Link>
                        {user?.role === 'patient' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleAutoBook(rec.doctor._id)} disabled={loading}>
                            🤖 Auto-Book
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="ai-disclaimer">
              ⚠️ <strong>Disclaimer:</strong> {result.disclaimer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
