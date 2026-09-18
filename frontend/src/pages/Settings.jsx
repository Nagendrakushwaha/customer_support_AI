import React, { useState } from 'react';
import { Settings as SettingsIcon, Sliders, Shield, Palette, Save, Check } from 'lucide-react';

export default function Settings() {
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.55);
  const [relevanceThreshold, setRelevanceThreshold] = useState(0.04);
  const [theme, setTheme] = useState('dark');
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('support_ai_conf_threshold', confidenceThreshold);
    localStorage.setItem('support_ai_rel_threshold', relevanceThreshold);
    localStorage.setItem('support_ai_auto_escalate', autoEscalate);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Top Banner */}
      <div className="card" style={{ marginBottom: '1.75rem', background: 'linear-gradient(135deg, var(--bg-card), var(--bg-card-subtle))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="brand-icon-wrapper" style={{ background: 'linear-gradient(135deg, #64748b, #475569)' }}>
            <SettingsIcon size={20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>System & Operational Settings</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Configure inference confidence gates, retrieval relevance bounds, and support routing parameters.
            </p>
          </div>
        </div>
      </div>

      {/* Model Calibration Sliders */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title"><Sliders size={18} color="var(--color-primary)" /> Inference Threshold Controls</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem' }}>
          
          {/* Confidence Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div>
                <strong style={{ fontSize: '0.9rem' }}>Intent Classification Confidence Cutoff</strong>
                <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                  Queries with prediction probability below this value are treated as low-confidence / unknown intents.
                </p>
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                {(confidenceThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.20"
              max="0.85"
              step="0.05"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <span>20% (More permissive)</span>
              <span>Default: 55%</span>
              <span>85% (Strict classification)</span>
            </div>
          </div>

          {/* Relevance Slider */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div>
                <strong style={{ fontSize: '0.9rem' }}>Knowledge Base Retrieval Relevance Threshold</strong>
                <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                  Cosine similarity cutoff for vector document chunks retrieved from official policy PDFs.
                </p>
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-accent)' }}>
                {relevanceThreshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.15"
              step="0.01"
              value={relevanceThreshold}
              onChange={(e) => setRelevanceThreshold(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <span>0.01 (Broad search)</span>
              <span>Default: 0.04</span>
              <span>0.15 (Strict match)</span>
            </div>
          </div>

          {/* Auto Escalation Toggle */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '0.9rem' }}>Automated Human Escalation Dispatch</strong>
              <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                Automatically flag sessions for tier-2 specialist review on security triggers or low confidence.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoEscalate}
              onChange={(e) => setAutoEscalate(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

        </div>
      </div>

      {/* Environment Diagnostics Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title"><Shield size={18} color="var(--status-success)" /> Security & Safe Configuration</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>API Target</span>
            <span style={{ fontWeight: '500' }}>/api (Proxied to 127.0.0.1:8000 in Dev)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Secrets Storage</span>
            <span style={{ fontWeight: '500', color: 'var(--status-success)' }}>Protected (.env isolated, zero client exposure)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Policy Baseline</span>
            <span style={{ fontWeight: '500' }}>ShopEase Authoritative Guidelines v1.0</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleSave}
          id="save-settings-btn"
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Preferences Saved!' : 'Save Preferences'}
        </button>
      </div>

    </div>
  );
}
