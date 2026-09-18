import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  MessageSquare, 
  BookOpen, 
  Cpu, 
  BarChart3, 
  Database, 
  Activity, 
  Settings as SettingsIcon,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import AIAssistant from './pages/AIAssistant';
import Conversations from './pages/Conversations';
import KnowledgeBase from './pages/KnowledgeBase';
import IntentDetection from './pages/IntentDetection';
import Analytics from './pages/Analytics';
import DatasetExplorer from './pages/DatasetExplorer';
import SystemStatus from './pages/SystemStatus';
import Settings from './pages/Settings';
import { api } from './services/api';

import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

export default function App() {
  const [activePage, setActivePage] = useState('assistant');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemHealthy, setSystemHealthy] = useState(true);

  useEffect(() => {
    api.getHealth()
      .then(res => setSystemHealthy(res.status === 'Operational'))
      .catch(() => setSystemHealthy(false));
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Core' },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, section: 'Core' },
    { id: 'conversations', label: 'Conversations', icon: MessageSquare, section: 'Core' },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, section: 'AI Engine' },
    { id: 'intents', label: 'Intent Detection', icon: Cpu, section: 'AI Engine' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, section: 'AI Engine' },
    { id: 'datasets', label: 'Dataset Explorer', icon: Database, section: 'Operations' },
    { id: 'status', label: 'System Status', icon: Activity, section: 'Operations' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, section: 'Operations' },
  ];

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={setActivePage} />;
      case 'assistant':
        return <AIAssistant />;
      case 'conversations':
        return <Conversations setActivePage={setActivePage} />;
      case 'knowledge':
        return <KnowledgeBase />;
      case 'intents':
        return <IntentDetection />;
      case 'analytics':
        return <Analytics />;
      case 'datasets':
        return <DatasetExplorer />;
      case 'status':
        return <SystemStatus />;
      case 'settings':
        return <Settings />;
      default:
        return <AIAssistant />;
    }
  };

  const getPageTitle = () => {
    const item = navItems.find(n => n.id === activePage);
    return item ? item.label : 'ShopEase Support AI';
  };

  return (
    <div className="app-container">
      
      {/* Sidebar Navigation */}
      <aside className={`app-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-icon-wrapper">
            <Sparkles size={20} />
          </div>
          <div className="brand-info">
            <h1>ShopEase AI</h1>
            <span>Conversational Support</span>
          </div>
          {mobileMenuOpen && (
            <button 
              onClick={() => setMobileMenuOpen(false)}
              style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar-nav">
          {['Core', 'AI Engine', 'Operations'].map((sec) => (
            <React.Fragment key={sec}>
              <div className="nav-section-title">{sec}</div>
              {navItems.filter(i => i.section === sec).map((item) => {
                const IconComponent = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActivePage(item.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <IconComponent className="nav-icon" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        {/* Sidebar Footer / Quick Status */}
        <div className="sidebar-footer">
          <div className="system-status-pill">
            <div className={`status-dot ${systemHealthy ? '' : 'degraded'}`} />
            <span>{systemHealthy ? 'AI Online' : 'System Degraded'}</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>v1.0.0</span>
        </div>

      </aside>

      {/* Main Content Area */}
      <div className="app-main">
        
        {/* Header Bar */}
        <header className="main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>
            <div className="page-title-group">
              <h2>{getPageTitle()}</h2>
              <p>ShopEase Enterprise Customer Support Intelligence</p>
            </div>
          </div>

          <div className="header-actions">
            <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)' }}></span>
              Production Mode
            </span>
          </div>
        </header>

        {/* Page View Body */}
        <main className="page-content" id="main-content-scroll">
          {renderActivePage()}
        </main>

      </div>

    </div>
  );
}
