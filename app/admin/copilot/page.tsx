'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { FileExplorer } from '@/components/FileExplorer';
import { RealIcon, RealIconName } from '@/components/design-system/RealIcon';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  actions?: Array<{ type: string; label: string; description?: string }>;
  data?: unknown;
}

interface SystemContext {
  activeCrawls: number;
  totalCrawls: number;
  failedJobs: number;
  alerts: number;
  activeWorkers: number;
  systemStatus: 'ok' | 'warning' | 'critical';
  lastCheckTime: string;
}

interface ConversationHistory {
  id: string;
  date: string;
  title: string;
  messageCount: number;
  messages: Message[];
}

export default function AICopilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<SystemContext | null>(null);
  const [commandMode, setCommandMode] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [aiModel, setAiModel] = useState<
    'openai' | 'ollama' | 'gpt-5-mini' | 'gpt-5.2-codex' | `ollama:${string}`
  >('ollama'); // Default to local Ollama auto-routing
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showHistoryManager, setShowHistoryManager] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [showApiKeyConfig, setShowApiKeyConfig] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [llmHealth, setLlmHealth] = useState<Array<{ model: string; endpoint: string; reachable: boolean; latencyMs?: number }> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchContext = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard-stats/');
      const data = await parseJsonResponse(res);
      setContext({
        activeCrawls: data.activeCrawls || 0,
        totalCrawls: data.totalCrawls || 0,
        failedJobs: data.failedJobs || 0,
        alerts: data.alerts || 0,
        activeWorkers: Math.floor(Math.random() * 5) + 1,
        systemStatus: data.failedJobs ? (data.failedJobs > 5 ? 'critical' : 'warning') : 'ok',
        lastCheckTime: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error('Failed to fetch context:', error);
    }
  }, []);

  useEffect(() => {
    fetchContext();
    loadStoredHistory();
    checkApiKeyStatus();
    fetchLlmHealth();
    const interval = setInterval(fetchContext, 30000);
    const healthInterval = setInterval(fetchLlmHealth, 60000);
    return () => { clearInterval(interval); clearInterval(healthInterval); };
  }, [fetchContext]);

  useEffect(() => {
    if (commandMode) {
      inputRef.current?.focus();
    }
  }, [commandMode]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const parseJsonResponse = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Unexpected response: ${text.slice(0, 200)}`);
    }
    return res.json();
  };

  const fetchLlmHealth = async () => {
    try {
      const res = await fetch('/api/admin/settings/llm-status/');
      if (!res.ok) return;
      const data = await res.json();
      // Flatten providers into an array for display
      const entries = Object.entries(data.providers ?? {}).map(([_, v]) => {
        const vObj = v as Record<string, unknown>;
        return {
          model: vObj.model as string,
          endpoint: _ as string,
          reachable: (vObj.reachable as boolean | null) ?? false,
          latencyMs: vObj.latencyMs as number | undefined,
        };
      });
      setLlmHealth(entries);
    } catch {
      // silent
    }
  };

  const checkApiKeyStatus = async () => {
    try {
      const res = await fetch('/api/admin/settings/openai-key/');
      const data = await res.json();
      setApiKeyConfigured(data.configured || false);
    } catch (error) {
      console.error('Failed to check API key status:', error);
    }
  };

  const saveApiKey = async () => {
    if (!openaiApiKey.trim()) {
      alert('Veuillez entrer une clé API valide');
      return;
    }
    setApiKeySaving(true);
    try {
      const res = await fetch('/api/admin/settings/openai-key/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: openaiApiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Échec de la sauvegarde');
      }
      alert('✅ Clé API sauvegardée ! Redémarrez le serveur pour l\'activer.');
      setApiKeyConfigured(true);
      setOpenaiApiKey('');
      setShowApiKeyConfig(false);
    } catch (error) {
      alert(`❌ Erreur: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setApiKeySaving(false);
    }
  };

  const loadStoredHistory = () => {
    if (typeof window === 'undefined') return;
    try {
      const historyRaw = localStorage.getItem('gtixt_copilot_history');
      const activeId = localStorage.getItem('gtixt_copilot_active_id');
      const storedHistory = historyRaw ? (JSON.parse(historyRaw) as ConversationHistory[]) : [];
      setConversationHistory(storedHistory);
      if (activeId) {
        const activeConversation = storedHistory.find((conv) => conv.id === activeId);
        if (activeConversation) {
          setActiveConversationId(activeId);
          setMessages(activeConversation.messages || []);
        }
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('gtixt_copilot_history', JSON.stringify(conversationHistory));
    if (activeConversationId) {
      localStorage.setItem('gtixt_copilot_active_id', activeConversationId);
    } else {
      localStorage.removeItem('gtixt_copilot_active_id');
    }
  }, [conversationHistory, activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) return;
    setConversationHistory((prev) =>
      prev.map((conv) =>
        conv.id === activeConversationId
          ? {
              ...conv,
              messages,
              messageCount: messages.length,
              date: new Date().toLocaleString('fr-FR'),
            }
          : conv
      )
    );
  }, [messages, activeConversationId]);

  const startNewConversation = (titleSeed?: string) => {
    const id = `conv_${Date.now()}`;
    const title = titleSeed?.trim() ? titleSeed.trim().slice(0, 60) : 'Nouvelle conversation';
    const newConversation: ConversationHistory = {
      id,
      title,
      date: new Date().toLocaleString('fr-FR'),
      messageCount: 0,
      messages: [],
    };
    setConversationHistory((prev) => [newConversation, ...prev].slice(0, 20));
    setActiveConversationId(id);
    setMessages([]);
    return id;
  };

  const handleHistorySelect = (conv: ConversationHistory) => {
    setActiveConversationId(conv.id);
    setMessages(conv.messages || []);
    setInput('');
  };

  const sendMessage = async (e?: React.FormEvent | KeyboardEvent, messageText?: string) => {
    if (e instanceof KeyboardEvent && e.key !== 'Enter') return;
    if (e instanceof Event) e.preventDefault();

    const msgToSend = messageText || input;
    if (!msgToSend.trim()) return;

    if (!activeConversationId) {
      startNewConversation(msgToSend);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msgToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/copilot/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgToSend,
          context,
          conversationHistory: messages,
          agentMode,
          aiModel, // Pass selected AI model
        }),
      });

      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.error || 'Copilot request failed');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Je n\'arrive pas à traiter votre demande',
        timestamp: new Date().toISOString(),
        model: data.model,
        actions: data.actions,
        data: data.data,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Auto-execute if agent mode
      if (agentMode && data.actions && data.actions.length > 0) {
        setTimeout(() => executeAction(data.actions[0]), 2000);
      }
    } catch (error) {
      console.error('Failed:', error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Erreur: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setCommandMode(false);
    }
  };

  const executeAction = async (action: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/admin/copilot/execute/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }
      const confirmMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ ${action.label}: ${data.result || 'Action exécutée'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, confirmMsg]);
      fetchContext();
    } catch (error) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Erreur: ${error}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const quickActions = [
    { icon: 'monitoring', label: 'Lancer un crawl', cmd: 'Lancer un crawl maintenant' },
    { icon: 'operations', label: 'Enrichissement', cmd: 'Démarrer enrichissement daily' },
    { icon: 'analytics', label: 'Scoring', cmd: 'Exécuter mise à jour scoring' },
    { icon: 'audit', label: 'Logs', cmd: 'Montre-moi les logs du dernier crawl' },
    { icon: 'health', label: 'Stats', cmd: 'Combien de firms actives ?' },
    { icon: 'shield', label: 'Erreurs', cmd: 'Quelles erreurs critiques ?' },
  ];

  const directExecutionActions: Array<{
    icon: RealIconName;
    label: string;
    action: { type: string; label: string; params?: Record<string, unknown> };
  }> = [
    {
      icon: 'analytics',
      label: 'Autoresearch',
      action: {
        type: 'autoresearch_cycle',
        label: 'Autoresearch',
        params: {
          targetMin: 120,
          batchSize: 12,
          sampleLimit: 1000,
        },
      },
    },
    {
      icon: 'operations',
      label: 'GtixtClaw',
      action: {
        type: 'openclaw_action',
        label: 'GtixtClaw',
        params: {
          actionType: 'redis_health',
        },
      },
    },
    {
      icon: 'shield',
      label: 'Firm Audit',
      action: {
        type: 'firm_consistency_audit',
        label: 'Firm Consistency Audit',
        params: { limit: 100 },
      },
    },
  ];

  const renderMessageContent = (content: string) => {
    const diffRegex = /```diff\n([\s\S]*?)```/g;
    const parts: Array<{ type: 'text' | 'diff'; value: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = diffRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', value: content.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'diff', value: match[1] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ type: 'text', value: content.slice(lastIndex) });
    }

    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {parts.map((part, idx) => {
          if (part.type === 'diff') {
            const lines = part.value.split('\n');
            return (
              <pre key={idx} className="text-xs bg-black/40 border border-cyan-400/30 rounded-lg p-3 overflow-x-auto">
                {lines.map((line, lineIdx) => {
                  let lineClass = 'text-white/80';
                  if (line.startsWith('+')) lineClass = 'text-green-300';
                  else if (line.startsWith('-')) lineClass = 'text-red-300';
                  else if (line.startsWith('@@')) lineClass = 'text-yellow-300';

                  return (
                    <div key={lineIdx} className={lineClass}>
                      {line}
                    </div>
                  );
                })}
              </pre>
            );
          }

          return (
            <p key={idx} className="whitespace-pre-wrap">
              {part.value.trim()}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="copilot-page-wrapper">
      <div className="copilot-ambient" aria-hidden="true" />
      
      {/* Main container with grid layout */}
      <div className={`copilot-container ${showSidebar ? '' : 'copilot-container--single'}`}>
        {/* Sidebar - toggleable */}
        {showSidebar && (
          <aside className="copilot-sidebar-main">
            {/* LLM Health Card */}
            {llmHealth && (
              <div className="copilot-sidebar-section">
                <div className="flex items-center justify-between">
                  <h3 className="copilot-sidebar-title">🧠 LLM Models</h3>
                  <button
                    type="button"
                    className="text-xs text-cyan-400 hover:text-cyan-200 opacity-70 hover:opacity-100 transition-opacity"
                    title="Refresh model health"
                    onClick={() => fetch('/api/admin/settings/llm-status?probe=1').then((r) => r.json()).then((d) => {
                      const entries = Object.entries(d.providers ?? {}).map(([_, v]) => { const vObj = v as Record<string, unknown>; return { model: vObj.model as string, endpoint: _ as string, reachable: (vObj.reachable as boolean | null) ?? false }; });
                      setLlmHealth(entries);
                    }).catch(() => {})}
                  >
                    ↻
                  </button>
                </div>
                <div className="space-y-1 mt-1">
                  {llmHealth.map((m, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-white/60 truncate max-w-[140px]" title={m.model}>{m.model}</span>
                      <span className={`font-semibold ml-1 flex-shrink-0 ${
                        m.reachable === true ? 'text-green-400' :
                        m.reachable === false ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {m.reachable === true ? '● OK' : m.reachable === false ? '● OFF' : '●  –'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Status Card */}
            <div className="copilot-sidebar-section">
              <h3 className="copilot-sidebar-title">🖥️ System Status</h3>
              <div className="copilot-status-grid">
                <div className="copilot-status-item">
                  <span className="copilot-status-label">Status</span>
                  <span className={`copilot-status-value ${context?.systemStatus === 'ok' ? 'text-green-400' : context?.systemStatus === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
                    {context?.systemStatus?.toUpperCase() || 'LOADING'}
                  </span>
                </div>
                <div className="copilot-status-item">
                  <span className="copilot-status-label">Crawls</span>
                  <span className="copilot-status-value">{context?.activeCrawls}/{context?.totalCrawls}</span>
                </div>
                <div className="copilot-status-item">
                  <span className="copilot-status-label">Erreurs</span>
                  <span className={`copilot-status-value ${context?.failedJobs ? 'text-red-400' : 'text-green-400'}`}>{context?.failedJobs || 0}</span>
                </div>
                <div className="copilot-status-item">
                  <span className="copilot-status-label">Alertes</span>
                  <span className="copilot-status-value">{context?.alerts || 0}</span>
                </div>
                <div className="copilot-status-item">
                  <span className="copilot-status-label">Workers</span>
                  <span className="copilot-status-value">{context?.activeWorkers}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions - single source*/}
            <div className="copilot-sidebar-section">
              <h3 className="copilot-sidebar-title">⚡ Actions Rapides</h3>
              <div className="copilot-quick-grid">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendMessage(undefined, action.cmd)}
                    className="copilot-quick-btn"
                    title={action.label}
                  >
                    <RealIcon name={action.icon as RealIconName} size={16} className="copilot-quick-icon" />
                    <span className="copilot-quick-label">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="copilot-sidebar-section">
              <h3 className="copilot-sidebar-title">🧭 Exécution Directe</h3>
              <div className="copilot-quick-grid">
                {directExecutionActions.map((action, i) => (
                  <button
                    key={`direct-${i}`}
                    type="button"
                    onClick={() => executeAction(action.action)}
                    className="copilot-quick-btn"
                    title={action.label}
                  >
                    <RealIcon name={action.icon} size={16} className="copilot-quick-icon" />
                    <span className="copilot-quick-label">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* File Explorer */}
            <div className="copilot-sidebar-section">
              <h3 className="copilot-sidebar-title">📁 File Explorer</h3>
              <div className="copilot-file-explorer">
                <FileExplorer
                  selectedPath={selectedFilePath || undefined}
                  onFileSelect={(filePath) => {
                    setSelectedFilePath(filePath);
                    sendMessage(undefined, `Read file: ${filePath}`);
                  }}
                />
              </div>
            </div>

            {/* Conversation History */}
            <div className="copilot-sidebar-section">
              <div className="copilot-history-header">
                <h3 className="copilot-sidebar-title">📝 Historique</h3>
                <button
                  type="button"
                  className="copilot-history-manage-btn"
                  onClick={() => setShowHistoryManager(!showHistoryManager)}
                >
                  Gérer
                </button>
              </div>
              <div className="copilot-history-list">
                {conversationHistory.slice(0, 5).map(conv => (
                  <button
                    key={conv.id}
                    type="button"
                    className="copilot-history-item"
                    onClick={() => handleHistorySelect(conv)}
                  >
                    <div className="copilot-history-title">{conv.title}</div>
                    <div className="copilot-history-date">{conv.date} • {conv.messageCount} msg</div>
                  </button>
                ))}
              </div>
              {showHistoryManager && (
                <div className="copilot-history-actions">
                  <button
                    type="button"
                    className="copilot-history-action-btn"
                    onClick={() => startNewConversation()}
                  >
                    Nouvelle conversation
                  </button>
                  <button
                    type="button"
                    className="copilot-history-action-btn copilot-history-action-danger"
                    onClick={() => {
                      setConversationHistory([]);
                      setActiveConversationId(null);
                      setMessages([]);
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('gtixt_copilot_history');
                        localStorage.removeItem('gtixt_copilot_active_id');
                      }
                    }}
                  >
                    Effacer l'historique
                  </button>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Main Chat Section */}
        <section className="copilot-main-section">
          {/* Header */}
          <div className="copilot-header-main">
            <div className="copilot-header-content">
              <h1 className="copilot-page-title">Copilote GTIXT</h1>
              <p className="copilot-page-subtitle">Assistant autonome pour supervision et actions critiques</p>
              <div className="copilot-quick-stats">
                <span className={`copilot-stat-chip ${context?.systemStatus === 'ok' ? 'copilot-stat-ok' : context?.systemStatus === 'warning' ? 'copilot-stat-warn' : 'copilot-stat-critical'}`}>
                  {context?.systemStatus?.toUpperCase() || 'LOADING'}
                </span>
                <span className="copilot-stat-chip">Workers {context?.activeWorkers ?? 0}</span>
                <span className="copilot-stat-chip">Alerts {context?.alerts ?? 0}</span>
              </div>
            </div>
            <div className="copilot-header-controls">
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value as 'openai' | 'ollama' | 'gpt-5-mini' | 'gpt-5.2-codex' | `ollama:${string}`)}
                className="copilot-model-select"
                title="Choisir le modèle AI"
              >
                <option value="ollama">🏠 Ollama Auto (routing intelligent)</option>
                <option value="ollama:glm4:9b">⚡ GLM4 9B (rapide)</option>
                <option value="ollama:deepseek-r1:32b">🧠 DeepSeek R1 32B (raisonnement)</option>
                <option value="ollama:qwen2.5-coder:32b">💻 Qwen Coder 32B (code)</option>
                <option value="ollama:llama3.3:70b-instruct-q3_K_M">🏋️ Llama 3.3 70B (lourd)</option>
                <option value="ollama:llama3.2-vision:11b">👁️ Vision 11B (images/UI)</option>
                <option value="openai">☁️ OpenAI (Auto)</option>
                <option value="gpt-5-mini">⚡ GPT-5 Mini</option>
                <option value="gpt-5.2-codex">🧠 GPT-5.2 Codex</option>
              </select>
              <button
                type="button"
                onClick={() => setShowApiKeyConfig(!showApiKeyConfig)}
                className={`copilot-control-btn ${apiKeyConfigured ? 'copilot-control-btn-success' : 'copilot-control-btn-warning'}`}
                title={apiKeyConfigured ? 'OpenAI configuré' : 'Configurer OpenAI'}
              >
                {apiKeyConfigured ? '🔑✓' : '🔑'} API Key
              </button>
              <button
                type="button"
                onClick={() => setAgentMode(!agentMode)} 
                className={`copilot-control-btn ${agentMode ? 'copilot-control-btn-active' : ''}`}
              >
                {agentMode ? '🤖' : '👤'} {agentMode ? 'Agent' : 'Manuel'}
              </button>
              <button
                type="button"
                onClick={() => setShowSidebar(!showSidebar)} 
                className="copilot-control-btn"
                title={showSidebar ? 'Masquer le panel' : 'Afficher le panel'}
              >
                {showSidebar ? '◀' : '▶'} Panel
              </button>
            </div>
          </div>

          {/* OpenAI API Key Configuration Modal */}
          {showApiKeyConfig && (
            <div className="copilot-api-key-modal">
              <div className="copilot-api-key-content">
                <h3>🔑 Configuration OpenAI API Key</h3>
                <p className="text-sm text-gray-300 mb-4">
                  {apiKeyConfigured ? (
                    <span className="text-green-400">✓ Une clé API est déjà configurée</span>
                  ) : (
                    <span className="text-yellow-400">⚠️ Aucune clé API configurée</span>
                  )}
                </p>
                <p className="text-sm text-gray-400 mb-3">
                  Obtenez votre clé API depuis <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">OpenAI Platform</a>
                </p>
                <input
                  type="password"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-...votre-clé-api..."
                  className="copilot-api-key-input"
                />
                <div className="copilot-api-key-actions">
                  <button
                    type="button"
                    onClick={saveApiKey}
                    disabled={apiKeySaving || !openaiApiKey.trim()}
                    className="copilot-api-key-save-btn"
                  >
                    {apiKeySaving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowApiKeyConfig(false);
                      setOpenaiApiKey('');
                    }}
                    className="copilot-api-key-cancel-btn"
                  >
                    Annuler
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  ⚠️ La clé sera sauvegardée dans le fichier .env. Redémarrez le serveur après modification.
                </p>
              </div>
            </div>
          )}

          {/* Chat Container */}
          <div className="copilot-chat-container">
            {/* Messages Surface */}
            <div className="assistant-surface">
              {messages.length === 0 && (
                <div className="assistant-empty">
                  <div className="assistant-empty-content">
                    <h2>Bienvenue au Copilote</h2>
                    <p>Choisis une action rapide ou pose une commande complexe.</p>
                    <div className="copilot-empty-actions">
                      {quickActions.slice(0, 3).map((action, i) => (
                        <button 
                          key={i} 
                          onClick={() => sendMessage(undefined, action.cmd)}
                          className="copilot-empty-action-btn"
                        >
                          <RealIcon name={action.icon as RealIconName} size={14} className="mr-2" />
                          {action.label}
                        </button>
                      ))}
                      {directExecutionActions.map((action, i) => (
                        <button
                          key={`direct-empty-${i}`}
                          onClick={() => executeAction(action.action)}
                          className="copilot-empty-action-btn"
                        >
                          <RealIcon name={action.icon} size={14} className="mr-2" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`assistant-row ${msg.role === 'user' ? 'assistant-row-user' : 'assistant-row-ai'}`}>
                  <div className={`assistant-bubble ${msg.role === 'user' ? 'assistant-bubble-user' : 'assistant-bubble-ai'}`}>
                    {msg.role === 'assistant' && msg.model && (
                      <div className="mb-2 inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200">
                        Model: {msg.model}
                      </div>
                    )}
                    {renderMessageContent(msg.content)}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.actions.map((action, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => executeAction(action)}
                            className="assistant-action"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <span className="assistant-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="assistant-row assistant-row-ai">
                  <div className="assistant-bubble assistant-bubble-ai">
                    <div className="assistant-loading">Analyse en cours...</div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Prompt Input Zone */}
            <form onSubmit={sendMessage} className="copilot-prompt-form">
              <div className="copilot-prompt-container">
                <div className="copilot-prompt-header">
                  <span className="copilot-prompt-label">Prompt Interaction Zone</span>
                  <span className="copilot-prompt-mode">{agentMode ? '🤖 Autopilote' : '👤 Manuel'}</span>
                </div>
                <textarea
                  ref={inputRef as unknown as React.RefObject<HTMLTextAreaElement>}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Donne une instruction, un patch ou une requete systeme..."
                  rows={3}
                  className="copilot-prompt-input"
                />
                <div className="copilot-prompt-footer">
                  <button
                    type="button"
                    onClick={() => setAgentMode(!agentMode)}
                    className={`copilot-prompt-btn ${agentMode ? 'copilot-prompt-btn-active' : ''}`}
                  >
                    {agentMode ? '🤖' : '👤'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="copilot-prompt-send-btn"
                  >
                    {loading ? '⏳' : '🚀'} {loading ? 'Traitement...' : 'Lancer'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
