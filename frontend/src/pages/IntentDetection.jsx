import React, { useState, useEffect } from 'react';
import { Cpu, Search, ArrowRight, AlertTriangle, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { api } from '../services/api';

const SAMPLE_QUERIES = [
  "I want to request a refund for my last order",
  "My card has not arrived yet, when will it be delivered?",
  "Why was my card pin blocked?",
  "Can I cancel a transfer that was already sent?",
  "What is the current foreign currency exchange rate?",
  "Can you write a poem about artificial intelligence?"
];

export default function IntentDetection() {
  const [inputText, setInputText] = useState('I want to get a refund for my order');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allIntents, setAllIntents] = useState([]);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    // Load initial list of all intents
    api.listIntents().then(res => {
      setAllIntents(res.intents || []);
    }).catch(err => console.error(err));

    // Run prediction on default query
    runPrediction('I want to get a refund for my order');
  }, []);

  const runPrediction = async (text) => {
    if (!text.trim()) return;
    try {
      setLoading(true);
      const res = await api.predictIntent(text.trim(), 3);
      setPrediction(res);
    } catch (err) {
      alert('Prediction failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredIntents = allIntents.filter(item =>
    item.name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div>
      {/* Top Header */}
      <div className="card" style={{ marginBottom: '1.75rem', background: 'linear-gradient(135deg, var(--bg-card), var(--bg-card-subtle))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="brand-icon-wrapper">
            <Cpu size={20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>NLP Intent Classification & Confidence Laboratory</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Evaluate real-time multiclass predictions across 77 fine-grained customer intent classes with calibrated probability distribution.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Testing Playground */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-title" style={{ marginBottom: '0.5rem' }}>
          <Sparkles size={18} color="var(--color-primary)" /> Live Query Analyzer
        </div>
        <p className="card-description" style={{ marginBottom: '1rem' }}>
          Enter any customer phrase to compute feature vectorization, intent inference, and routing decision.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Type customer message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runPrediction(inputText)}
            style={{ flex: 1 }}
            id="intent-test-input"
          />
          <button 
            className="btn btn-primary"
            onClick={() => runPrediction(inputText)}
            disabled={loading || !inputText.trim()}
            id="intent-test-submit"
          >
            {loading ? 'Evaluating...' : 'Predict Intent'}
          </button>
        </div>

        {/* Sample chips */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Samples:</span>
          {SAMPLE_QUERIES.map((sq, sIdx) => (
            <button
              key={sIdx}
              onClick={() => {
                setInputText(sq);
                runPrediction(sq);
              }}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-card-subtle)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Prediction Results Card */}
        {prediction && (
          <div style={{
            background: 'var(--bg-sidebar)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Predicted Primary Intent
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-primary)', marginTop: '0.25rem' }}>
                  {prediction.predicted_intent}
                </div>
                <div style={{ marginTop: '0.35rem' }}>
                  <span className={`badge ${prediction.is_known_intent ? 'badge-success' : 'badge-danger'}`}>
                    {prediction.is_known_intent ? 'Known Intent' : 'Low Confidence / Unknown'}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Calibrated Confidence Score
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>
                  {(prediction.confidence * 100).toFixed(2)}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Threshold: {(prediction.threshold_applied * 100).toFixed(0)}% (Level: {prediction.confidence_level.toUpperCase()})
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Routing Policy Document
                </span>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-accent)', marginTop: '0.25rem' }}>
                  {prediction.relevant_policy_doc}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Action: {prediction.recommended_action}
                </div>
              </div>

            </div>

            {/* Probability Distribution of Top-3 Candidates */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Probability Distribution Across Top Ranked Classes:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {prediction.top_candidates.map((cand, cIdx) => (
                  <div key={cIdx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '500' }}>#{cIdx + 1} {cand.intent}</span>
                      <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                        {(cand.confidence * 100).toFixed(2)}%
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div style={{
                      height: '6px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${cand.confidence * 100}%`,
                        background: cIdx === 0 
                          ? 'linear-gradient(90deg, var(--color-primary), var(--color-accent))' 
                          : 'rgba(255, 255, 255, 0.25)',
                        borderRadius: 'var(--radius-full)'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Complete Intent Taxonomy Dictionary */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Banking77 Intent Taxonomy Dictionary ({allIntents.length})</div>
            <div className="card-description">All 77 distinct customer care intent classes supported by the model</div>
          </div>
          <input
            type="text"
            placeholder="Filter intent names..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{ width: '220px', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '0.65rem',
          maxHeight: '340px',
          overflowY: 'auto',
          padding: '0.5rem'
        }}>
          {filteredIntents.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setInputText(item.sample_query);
                runPrediction(item.sample_query);
              }}
              style={{
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            >
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.725rem', marginTop: '2px' }}>
                Click to test utterance
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
