import React, { useState, useEffect } from 'react';
import { BookOpen, Search, FileText, Layers, ExternalLink, CheckCircle, Shield } from 'lucide-react';
import { api } from '../services/api';

export default function KnowledgeBase() {
  const [kbData, setKbData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadKB() {
      try {
        setLoading(true);
        const data = await api.getKnowledgeBase();
        setKbData(data);
      } catch (err) {
        console.error('Failed to load knowledge base catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadKB();
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const res = await api.searchKnowledgeBase(searchQuery.trim(), 4);
      setSearchResults(res.results || []);
    } catch (err) {
      alert('Search failed: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const docs = kbData?.documents || [];
  const filteredDocs = selectedDoc === 'all' 
    ? docs 
    : docs.filter(d => d.document_type.toLowerCase().includes(selectedDoc.toLowerCase()));

  const categories = ['all', ...new Set(docs.map(d => d.document_type))];

  return (
    <div>
      {/* Header Banner */}
      <div className="card" style={{ marginBottom: '1.75rem', background: 'linear-gradient(135deg, var(--bg-card), var(--bg-card-subtle))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
          <div className="brand-icon-wrapper" style={{ background: 'var(--color-accent)' }}>
            <BookOpen size={20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>ShopEase Official Knowledge Base</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Authoritative support policies, escalation rules, refund SLAs, and FAQ document vector store.
            </p>
          </div>
        </div>

        {/* Authoritative Policy Constants Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.8rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Support Hours:</span>
            <div style={{ fontWeight: '600', marginTop: '2px' }}>Mon–Sat, 9:00 AM–8:00 PM IST</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Toll-Free Helpline:</span>
            <div style={{ fontWeight: '600', marginTop: '2px', color: 'var(--color-primary)' }}>1800-123-EASE (3273)</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Return Window:</span>
            <div style={{ fontWeight: '600', marginTop: '2px' }}>7 Calendar Days from Delivery</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Security Protocol:</span>
            <div style={{ fontWeight: '600', marginTop: '2px', color: 'var(--status-success)' }}>Zero Password/OTP Requests</div>
          </div>
        </div>
      </div>

      {/* Interactive Vector Search Playground */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-title" style={{ marginBottom: '0.5rem' }}>
          <Search size={18} color="var(--color-primary)" /> Vector Retrieval Playground
        </div>
        <p className="card-description" style={{ marginBottom: '1rem' }}>
          Test vector semantic matching directly against chunked PDF embeddings.
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <input
            type="text"
            placeholder="Type a policy query (e.g., 'How long does a refund take?', 'Electronics warranty period')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
            id="kb-search-input"
          />
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={searching || !searchQuery.trim()}
            id="kb-search-submit"
          >
            {searching ? 'Retrieving...' : 'Search Vectors'}
          </button>
        </form>

        {/* Search Results Display */}
        {searchResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Top Retrieved Chunks ({searchResults.length})
            </h4>
            {searchResults.map((res, rIdx) => (
              <div key={rIdx} style={{
                padding: '1rem',
                background: 'var(--bg-sidebar)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={16} color="var(--color-primary)" />
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{res.document_title}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Page {res.page}</span>
                  </div>
                  <span className="badge badge-info">
                    Match Score: {(res.score * 100).toFixed(1)}%
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  "{res.text}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catalog & Filter */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title"><Layers size={18} /> Indexed Support Policy Documents</div>
            <div className="card-description">{docs.length} verified PDF documents ingested via PyMuPDF</div>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {categories.slice(0, 6).map((cat, cIdx) => (
              <button
                key={cIdx}
                onClick={() => setSelectedDoc(cat)}
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  border: '1px solid var(--border-subtle)',
                  background: selectedDoc === cat ? 'var(--color-primary)' : 'var(--bg-card-subtle)',
                  color: selectedDoc === cat ? 'white' : 'var(--text-secondary)'
                }}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table of PDF Documents */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document File</th>
                <th>Official Title</th>
                <th>Category</th>
                <th>Pages</th>
                <th>Vector Chunks</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={15} color="var(--color-primary)" />
                      <span style={{ fontWeight: '500' }}>{doc.filename}</span>
                    </div>
                  </td>
                  <td>{doc.title}</td>
                  <td><span className="badge badge-primary">{doc.document_type}</span></td>
                  <td>{doc.pages}</td>
                  <td><span className="badge badge-info">{doc.chunks} chunks</span></td>
                  <td>
                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle size={10} /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
