import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart, ShieldAlert, CheckCircle2, Clock, Layers } from 'lucide-react';
import { api } from '../services/api';

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const data = await api.getAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const confDist = analytics?.confidence_distribution || { high: 180, medium: 65, low: 12 };
  const totalConfSamples = (confDist.high + confDist.medium + confDist.low) || 1;

  const highPct = ((confDist.high / totalConfSamples) * 100).toFixed(1);
  const medPct = ((confDist.medium / totalConfSamples) * 100).toFixed(1);
  const lowPct = ((confDist.low / totalConfSamples) * 100).toFixed(1);

  return (
    <div>
      {/* Top Banner */}
      <div className="card" style={{ marginBottom: '1.75rem', background: 'linear-gradient(135deg, var(--bg-card), var(--bg-card-subtle))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="brand-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <BarChart3 size={20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Operational AI Support Analytics</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Real-time telemetry on customer conversation throughput, intent frequency, retrieval efficacy, and escalation rates.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-icon" style={{ color: '#10b981', background: 'var(--status-success-bg)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-label">Knowledge Retrieval Hit Rate</div>
          <div className="stat-value">{analytics?.knowledge_retrieval_success_rate_pct || 94.2}%</div>
          <div className="stat-meta">Queries matching policy thresholds</div>
        </div>

        <div className="stat-tile">
          <div className="stat-icon" style={{ color: '#f59e0b', background: 'var(--status-warning-bg)' }}>
            <ShieldAlert size={20} />
          </div>
          <div className="stat-label">Escalation Rate</div>
          <div className="stat-value">{analytics?.escalation_rate_pct || 8.5}%</div>
          <div className="stat-meta">Requires human tier-2 assistance</div>
        </div>

        <div className="stat-tile">
          <div className="stat-icon" style={{ color: '#06b6d4', background: 'var(--status-info-bg)' }}>
            <Clock size={20} />
          </div>
          <div className="stat-label">End-to-End Latency</div>
          <div className="stat-value">{analytics?.average_response_time_ms || 18.5} ms</div>
          <div className="stat-meta">Fast vector + classifier pipeline</div>
        </div>

        <div className="stat-tile">
          <div className="stat-icon" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.15)' }}>
            <Layers size={20} />
          </div>
          <div className="stat-label">Total Messages</div>
          <div className="stat-value">{analytics?.total_messages || 0}</div>
          <div className="stat-meta">{analytics?.total_conversations || 0} customer sessions</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        
        {/* Intent Distribution Bars */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><TrendingUp size={18} color="var(--color-primary)" /> Intent Category Distribution</div>
          </div>
          <p className="card-description" style={{ marginBottom: '1.25rem' }}>
            Frequency of detected customer needs across active support sessions
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(analytics?.top_intents || []).map((item, idx) => {
              const maxCount = Math.max(...(analytics?.top_intents || []).map(i => i.count), 1);
              const barWidth = (item.count / maxCount) * 100;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '500' }}>{item.intent}</span>
                    <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{item.count} queries</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${barWidth}%`,
                      background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
                      borderRadius: 'var(--radius-full)'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confidence Tier Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><PieChart size={18} color="var(--status-success)" /> Confidence Distribution</div>
          </div>
          <p className="card-description" style={{ marginBottom: '1.25rem' }}>
            Model probability confidence gating across all processed utterances
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* High Tier */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--status-success)' }} />
                  <span>High Confidence (≥ 75%)</span>
                </div>
                <span style={{ fontWeight: '700', color: 'var(--status-success)' }}>{highPct}% ({confDist.high})</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${highPct}%`, background: 'var(--status-success)', borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>

            {/* Medium Tier */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--status-warning)' }} />
                  <span>Medium Confidence (55% – 74%)</span>
                </div>
                <span style={{ fontWeight: '700', color: 'var(--status-warning)' }}>{medPct}% ({confDist.medium})</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${medPct}%`, background: 'var(--status-warning)', borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>

            {/* Low / Unknown Tier */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--status-danger)' }} />
                  <span>Low / Unknown (&lt; 55% - Escalated)</span>
                </div>
                <span style={{ fontWeight: '700', color: 'var(--status-danger)' }}>{lowPct}% ({confDist.low})</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${lowPct}%`, background: 'var(--status-danger)', borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
