import React, { useState } from 'react';
import './EmergencySOS.css';

const EMERGENCY_NUMBERS = [
  { label: 'Ambulance', number: '108', icon: '🚑', desc: 'National Emergency Ambulance' },
  { label: 'Police', number: '100', icon: '👮', desc: 'Police Emergency' },
  { label: 'Fire', number: '101', icon: '🚒', desc: 'Fire Brigade' },
  { label: 'Disaster', number: '112', icon: '🆘', desc: 'Universal Emergency Number' },
  { label: 'Women Helpline', number: '1091', icon: '👩', desc: 'Women in Distress' },
  { label: 'Child Helpline', number: '1098', icon: '👶', desc: 'Child Abuse / Missing Child' },
];

export default function EmergencySOS() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sos-container">
      {open && (
        <div className="sos-panel">
          <div className="sos-panel-header">
            <h3>🆘 Emergency SOS</h3>
            <button className="sos-close" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="sos-panel-body">
            <p className="sos-disclaimer">For immediate medical emergencies, always call your local emergency number or go to the nearest hospital.</p>
            <div className="sos-numbers">
              {EMERGENCY_NUMBERS.map((item, i) => (
                <a key={i} href={`tel:${item.number}`} className="sos-number-item">
                  <span className="sos-num-icon">{item.icon}</span>
                  <div className="sos-num-info">
                    <h4>{item.label}</h4>
                    <p>{item.desc}</p>
                  </div>
                  <span className="sos-num-badge">{item.number}</span>
                </a>
              ))}
            </div>
            <div className="sos-tips">
              <h4>💡 While Waiting for Help</h4>
              <ul>
                <li>Stay calm and remain with the person</li>
                <li>Keep airways clear</li>
                <li>If trained, begin CPR if needed</li>
                <li>Note the time symptoms started</li>
                <li>Do not give food or drink if unconscious</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      <button className="sos-fab" onClick={() => setOpen(!open)} title="Emergency SOS">
        {open ? '✕' : '🆘'}
      </button>
    </div>
  );
}
