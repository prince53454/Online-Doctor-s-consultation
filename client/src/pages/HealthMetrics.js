import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './HealthMetrics.css';

const METRIC_TYPES = [
  { key: 'bloodPressure', label: 'Blood Pressure', unit: 'mmHg', icon: '❤️', color: '#EF4444', placeholder: '120/80' },
  { key: 'bloodSugar', label: 'Blood Sugar', unit: 'mg/dL', icon: '🩸', color: '#F59E0B', placeholder: '95' },
  { key: 'weight', label: 'Weight', unit: 'kg', icon: '⚖️', color: '#3B82F6', placeholder: '70' },
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', icon: '💓', color: '#EC4899', placeholder: '72' },
  { key: 'temperature', label: 'Temperature', unit: '°F', icon: '🌡️', color: '#8B5CF6', placeholder: '98.6' },
  { key: 'oxygenLevel', label: 'Oxygen Level', unit: '%', icon: '🫁', color: '#10B981', placeholder: '98' },
];

export default function HealthMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedType, setSelectedType] = useState('bloodPressure');
  const [form, setForm] = useState({ value: '', value2: '', note: '' });
  const [activeChart, setActiveChart] = useState('bloodPressure');

  useEffect(() => { fetchMetrics(); }, []);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/medical-records').catch(() => ({ data: {} }));
      // Metrics stored locally for now
      const stored = JSON.parse(localStorage.getItem(`healthMetrics_${user?.id}`) || '[]');
      setMetrics(stored);
    } catch (e) {
      const stored = JSON.parse(localStorage.getItem(`healthMetrics_${user?.id}`) || '[]');
      setMetrics(stored);
    } finally {
      setLoading(false);
    }
  };

  const addMetric = () => {
    if (!form.value) { toast.error('Please enter a value'); return; }
    const metric = {
      id: Date.now().toString(),
      type: selectedType,
      value: form.value,
      value2: form.value2 || undefined,
      note: form.note,
      date: new Date().toISOString(),
    };
    const updated = [metric, ...metrics];
    setMetrics(updated);
    localStorage.setItem(`healthMetrics_${user?.id}`, JSON.stringify(updated));
    setForm({ value: '', value2: '', note: '' });
    setShowAdd(false);
    toast.success('Metric recorded! ✅');
  };

  const deleteMetric = (id) => {
    const updated = metrics.filter(m => m.id !== id);
    setMetrics(updated);
    localStorage.setItem(`healthMetrics_${user?.id}`, JSON.stringify(updated));
    toast.success('Deleted');
  };

  const getLatest = (type) => metrics.find(m => m.type === type);
  const getHistory = (type) => metrics.filter(m => m.type === type).slice(0, 30);

  const isAbnormal = (type, value) => {
    const v = parseFloat(value);
    const ranges = {
      bloodPressure: { min: 90, max: 140 }, // systolic
      bloodSugar: { min: 70, max: 140 },
      weight: { min: 40, max: 120 },
      heartRate: { min: 60, max: 100 },
      temperature: { min: 97, max: 99.5 },
      oxygenLevel: { min: 95, max: 100 },
    };
    const r = ranges[type];
    return r && (v < r.min || v > r.max);
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="hm-page">
      <div className="container">
        <div className="hm-header">
          <div>
            <h1>📊 Health Metrics</h1>
            <p className="text-muted">Track and monitor your vital signs over time</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Record Metric</button>
        </div>

        {/* Latest Values Grid */}
        <div className="hm-latest-grid">
          {METRIC_TYPES.map(mt => {
            const latest = getLatest(mt.key);
            const abnormal = latest && isAbnormal(mt.key, latest.value);
            return (
              <div key={mt.key} className={`hm-latest-card ${abnormal ? 'abnormal' : ''}`} onClick={() => setActiveChart(mt.key)}>
                <div className="hm-lc-top">
                  <span className="hm-lc-icon" style={{ background: mt.color + '15' }}>{mt.icon}</span>
                  <span className="hm-lc-label">{mt.label}</span>
                </div>
                {latest ? (
                  <div className="hm-lc-value">
                    <span className="hm-lc-number" style={{ color: abnormal ? '#EF4444' : mt.color }}>
                      {latest.value}{latest.value2 ? `/${latest.value2}` : ''}
                    </span>
                    <span className="hm-lc-unit">{mt.unit}</span>
                  </div>
                ) : (
                  <div className="hm-lc-empty">No data yet</div>
                )}
                {latest && (
                  <div className="hm-lc-time">
                    {new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Chart / History */}
        <div className="hm-card">
          <div className="hm-card-header">
            <h3>{METRIC_TYPES.find(m => m.key === activeChart)?.icon} {METRIC_TYPES.find(m => m.key === activeChart)?.label} History</h3>
          </div>
          <div className="hm-card-body">
            {getHistory(activeChart).length === 0 ? (
              <div className="hm-empty-chart">
                <span>📊</span>
                <p>No {METRIC_TYPES.find(m => m.key === activeChart)?.label.toLowerCase()} data recorded yet</p>
              </div>
            ) : (
              <div className="hm-chart-bars">
                {getHistory(activeChart).reverse().map((m, i) => {
                  const maxVal = Math.max(...getHistory(activeChart).map(x => parseFloat(x.value)), 1);
                  const height = (parseFloat(m.value) / maxVal) * 100;
                  const abnormal = isAbnormal(m.type, m.value);
                  return (
                    <div key={i} className="hm-bar-item">
                      <div className="hm-bar-wrapper">
                        <span className="hm-bar-value">{m.value}{m.value2 ? `/${m.value2}` : ''}</span>
                        <div className="hm-bar" style={{ height: `${Math.max(height, 5)}%`, background: abnormal ? '#EF4444' : METRIC_TYPES.find(mt => mt.key === m.type)?.color || '#4F46E5' }} />
                      </div>
                      <span className="hm-bar-date">{new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {getHistory(activeChart).length > 0 && (
              <div className="hm-history-list">
                <h4>Recent Readings</h4>
                {getHistory(activeChart).map(m => (
                  <div key={m.id} className="hm-history-item">
                    <span className="hm-hi-value" style={{ color: isAbnormal(m.type, m.value) ? '#EF4444' : '#0f172a' }}>
                      {m.value}{m.value2 ? `/${m.value2}` : ''} {METRIC_TYPES.find(mt => mt.key === m.type)?.unit}
                    </span>
                    <span className="hm-hi-date">{new Date(m.date).toLocaleDateString()} {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {m.note && <span className="hm-hi-note">{m.note}</span>}
                    <button className="hm-hi-delete" onClick={() => deleteMetric(m.id)}>🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Metric Modal */}
      {showAdd && (
        <div className="hm-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="hm-modal" onClick={e => e.stopPropagation()}>
            <div className="hm-modal-header">
              <h3>📊 Record Health Metric</h3>
              <button onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="hm-modal-body">
              <div className="hm-type-selector">
                {METRIC_TYPES.map(mt => (
                  <button key={mt.key} className={`hm-type-btn ${selectedType === mt.key ? 'active' : ''}`} onClick={() => setSelectedType(mt.key)}>
                    <span>{mt.icon}</span>
                    <span>{mt.label}</span>
                  </button>
                ))}
              </div>

              <div className="hm-form">
                {selectedType === 'bloodPressure' ? (
                  <div className="hm-bp-inputs">
                    <div className="form-group">
                      <label className="form-label">Systolic (top)</label>
                      <input className="form-input" type="number" placeholder="120" value={form.value} onChange={e => setForm({...form, value: e.target.value})} />
                    </div>
                    <span className="hm-bp-slash">/</span>
                    <div className="form-group">
                      <label className="form-label">Diastolic (bottom)</label>
                      <input className="form-input" type="number" placeholder="80" value={form.value2} onChange={e => setForm({...form, value2: e.target.value})} />
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">{METRIC_TYPES.find(m => m.key === selectedType)?.label} ({METRIC_TYPES.find(m => m.key === selectedType)?.unit})</label>
                    <input className="form-input" type="number" step="0.1" placeholder={METRIC_TYPES.find(m => m.key === selectedType)?.placeholder} value={form.value} onChange={e => setForm({...form, value: e.target.value})} />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Note (optional)</label>
                  <input className="form-input" placeholder="e.g., After exercise, before bed..." value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
                </div>

                <button className="btn btn-primary btn-lg btn-full" onClick={addMetric}>Save Reading</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
