import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  AlertTriangle, 
  BookOpen, 
  RotateCcw, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  ChevronDown, 
  ChevronUp, 
  PlusCircle, 
  Trash2,
  ShieldAlert,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

const QUICK_PROMPTS = [
  "How do I request a refund for a returned item?",
  "Where can I track my shipped order delivery status?",
  "What is the cancellation policy before an order is dispatched?",
  "Someone accessed my account without permission!",
  "Tell me a recipe for chocolate cake"
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: "Hello! Welcome to ShopEase Customer Care. How can I assist you today? You can ask about order status, refunds, returns, warranty, discounts, or cancellation policies.",
      intent: 'general_greeting',
      confidence: 1.0,
      sources: [],
      escalation_required: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [feedbackState, setFeedbackState] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const toggleSource = (msgId) => {
    setExpandedSources(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id, type) => {
    setFeedbackState(prev => ({ ...prev, [id]: type }));
  };

  const handleSend = async (textToSend = null) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMsgId = 'user-' + Date.now();
    const newMsg = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const res = await api.sendMessage(query, conversationId);
      
      if (res.conversation_id && !conversationId) {
        setConversationId(res.conversation_id);
      }

      const assistantMsg = {
        id: 'asst-' + Date.now(),
        role: 'assistant',
        content: res.message,
        intent: res.intent,
        confidence: res.confidence,
        confidence_level: res.confidence_level,
        sources: res.sources || [],
        escalation_required: res.escalation_required,
        escalation_reason: res.escalation_reason,
        timestamp: new Date(res.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: `Error: ${err.message || 'Unable to communicate with support backend.'}. Please check that the server is operational.`,
        intent: 'system_error',
        confidence: 0,
        sources: [],
        escalation_required: true,
        escalation_reason: 'Network or backend error',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: "New session started. How can I help you with your ShopEase orders, refunds, or policies today?",
        intent: 'general_greeting',
        confidence: 1.0,
        sources: [],
        escalation_required: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', height: 'calc(100vh - 110px)' }}>
      <div className="chat-container">
        
        {/* Chat Control Header */}
        <div style={{
          padding: '0.85rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--status-success)',
              boxShadow: '0 0 8px var(--status-success)'
            }}></div>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Active Support Agent</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                {conversationId ? `Session ID: ${conversationId.slice(0, 8)}...` : 'Local Session'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={handleNewConversation}
              title="Start a new support session"
              id="new-chat-btn"
            >
              <PlusCircle size={14} /> New Chat
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="chat-messages" id="chat-messages-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble-row ${msg.role}`}>
              <div className={`chat-avatar ${msg.role}`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>

              <div className="chat-bubble-content">
                {/* Main Message Bubble */}
                <div className="chat-bubble">
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                </div>

                {/* Assistant Metadata (Intent, Confidence, Sources, Escalation) */}
                {msg.role === 'assistant' && msg.intent && (
                  <div>
                    <div className="chat-meta-bar">
                      {/* Intent Tag */}
                      <span className="badge badge-primary">
                        Intent: {msg.intent.replace(/_/g, ' ')}
                      </span>

                      {/* Confidence Tag */}
                      {msg.confidence !== undefined && (
                        <span className={`badge ${
                          msg.confidence >= 0.75 ? 'badge-success' :
                          msg.confidence >= 0.55 ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {(msg.confidence * 100).toFixed(1)}% Confidence
                        </span>
                      )}

                      {/* Source count toggle */}
                      {msg.sources && msg.sources.length > 0 && (
                        <button 
                          onClick={() => toggleSource(msg.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.5rem',
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <BookOpen size={12} color="var(--color-primary)" />
                          {msg.sources.length} Cited Sources
                          {expandedSources[msg.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}

                      {/* Utilities: Copy & Feedback */}
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.35rem' }}>
                        <button 
                          onClick={() => handleCopy(msg.id, msg.content)}
                          style={{ padding: '0.25rem', color: copiedId === msg.id ? 'var(--status-success)' : 'var(--text-muted)' }}
                          title="Copy response"
                        >
                          {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button 
                          onClick={() => handleFeedback(msg.id, 'up')}
                          style={{ padding: '0.25rem', color: feedbackState[msg.id] === 'up' ? 'var(--status-success)' : 'var(--text-muted)' }}
                          title="Helpful"
                        >
                          <ThumbsUp size={14} />
                        </button>
                        <button 
                          onClick={() => handleFeedback(msg.id, 'down')}
                          style={{ padding: '0.25rem', color: feedbackState[msg.id] === 'down' ? 'var(--status-danger)' : 'var(--text-muted)' }}
                          title="Not helpful"
                        >
                          <ThumbsDown size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Citations Drawer */}
                    {expandedSources[msg.id] && msg.sources && (
                      <div className="sources-container">
                        <div className="sources-title">Authoritative Knowledge Base Citations</div>
                        {msg.sources.map((src, sIdx) => (
                          <div key={sIdx} className="source-item">
                            <div>
                              <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                                {src.document_title}
                              </span>
                              <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                                (Page {src.page})
                              </span>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                                "{src.snippet}"
                              </p>
                            </div>
                            <span className="badge badge-info" style={{ marginLeft: '0.75rem', flexShrink: 0 }}>
                              Match: {(src.relevance_score * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Escalation Alert */}
                    {msg.escalation_required && (
                      <div className="escalation-banner">
                        <ShieldAlert size={18} flexShrink={0} />
                        <div>
                          <strong>Human Support Escalation Triggered</strong>
                          <div style={{ fontSize: '0.785rem', opacity: 0.9 }}>
                            Reason: {msg.escalation_reason || 'Specialist intervention requested or required.'}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', marginTop: '2px' }}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-bubble-row assistant">
              <div className="chat-avatar assistant"><Bot size={18} /></div>
              <div className="chat-bubble-content">
                <div className="typing-dots">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div style={{
          padding: '0.65rem 1.5rem',
          background: '#f8fafc',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          {QUICK_PROMPTS.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '0.775rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <HelpCircle size={12} color="var(--color-primary)" />
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="chat-input-bar">
          <input
            type="text"
            placeholder="Type your support query (e.g. 'Can I return an item after 7 days?')..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            id="chat-input-field"
          />
          <button 
            className="btn btn-primary"
            onClick={() => handleSend()}
            disabled={loading || !inputMessage.trim()}
            id="send-message-btn"
          >
            <Send size={16} /> Send
          </button>
        </div>

      </div>
    </div>
  );
}
