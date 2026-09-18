import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Trash2, Calendar, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { api } from '../services/api';

export default function Conversations({ setActivePage }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await api.listConversations();
      setSessions(data || []);
      if (data && data.length > 0) {
        setSelectedSession(data[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation history?')) return;
    try {
      await api.deleteConversation(id);
      setSessions(prev => prev.filter(s => s.conversation_id !== id));
      if (selectedSession?.conversation_id === id) {
        setSelectedSession(null);
      }
    } catch (err) {
      alert('Could not delete session: ' + err.message);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.last_intent && s.last_intent.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>
      
      {/* Sessions Master Column */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div className="card-title" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
            <MessageSquare size={18} color="var(--color-primary)" /> Conversation History
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '2rem', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* List of Sessions */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No recorded conversations yet.
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.conversation_id}
                onClick={() => setSelectedSession(session)}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: selectedSession?.conversation_id === session.conversation_id ? 'var(--color-primary-light)' : 'var(--bg-card-subtle)',
                  border: `1px solid ${selectedSession?.conversation_id === session.conversation_id ? 'rgba(59, 130, 246, 0.4)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session.title}
                  </span>
                  <button
                    onClick={(e) => handleDelete(session.conversation_id, e)}
                    style={{ color: 'var(--text-muted)', padding: '2px' }}
                    title="Delete session"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                  <span className={`badge ${session.status === 'escalated' ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                    {session.status}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {session.message_count} msgs
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected Session Detail View */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedSession ? (
          <>
            {/* Header */}
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{selectedSession.title}</h3>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Session ID: {selectedSession.conversation_id} • Created: {new Date(selectedSession.created_at).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className={`badge ${selectedSession.status === 'escalated' ? 'badge-danger' : 'badge-success'}`}>
                  Status: {selectedSession.status}
                </span>
              </div>
            </div>

            {/* Transcript Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedSession.messages.map((msg, mIdx) => (
                <div key={mIdx} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%'
                }}>
                  <div style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}>
                    {msg.content}
                  </div>

                  {msg.role === 'assistant' && msg.intent && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', fontSize: '0.75rem' }}>
                      <span className="badge badge-primary">Intent: {msg.intent}</span>
                      {msg.confidence && <span className="badge badge-success">{(msg.confidence * 100).toFixed(0)}% Conf</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="state-box">
            <MessageSquare size={48} />
            <h3>No Conversation Selected</h3>
            <p>Select a session from the left column to review messages, intent classifications, and resolution status.</p>
          </div>
        )}
      </div>

    </div>
  );
}
