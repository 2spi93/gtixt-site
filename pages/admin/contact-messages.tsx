'use client';

import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useTranslation } from "../../lib/useTranslationStub";

interface Message {
  id: string;
  name: string;
  email: string;
  organization?: string;
  subject: string;
  message: string;
  recipientEmail: string;
  timestamp: string;
  status: string;
}

export default function ContactMessages() {
  const { t } = useTranslation("common");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/contact/messages');
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = filter === 'all' 
    ? messages 
    : messages.filter(m => m.subject === filter);

  const subjectLabels: Record<string, string> = {
    api: 'API Access',
    support: 'Support',
    legal: 'Legal',
    privacy: 'Privacy',
  };

  const subjectColors: Record<string, string> = {
    api: '#3b82f6',
    support: '#10b981',
    legal: '#f59e0b',
    privacy: '#8b5cf6',
  };

  return (
    <>
      <Head>
        <title>Contact Messages - GTIXT Admin</title>
      </Head>

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>📧 Contact Messages</h1>
          <div style={styles.stats}>
            <div style={styles.stat}>
              <span style={styles.statValue}>{messages.length}</span>
              <span style={styles.statLabel}>Total Messages</span>
            </div>
            <button onClick={fetchMessages} style={styles.refreshBtn}>
              🔄 Refresh
            </button>
          </div>
        </div>

        <div style={styles.filters}>
          <button
            onClick={() => setFilter('all')}
            style={{
              ...styles.filterBtn,
              ...(filter === 'all' && styles.filterBtnActive),
            }}
          >
            All ({messages.length})
          </button>
          {['api', 'support', 'legal', 'privacy'].map(subject => {
            const count = messages.filter(m => m.subject === subject).length;
            return (
              <button
                key={subject}
                onClick={() => setFilter(subject)}
                style={{
                  ...styles.filterBtn,
                  ...(filter === subject && styles.filterBtnActive),
                }}
              >
                {subjectLabels[subject]} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={styles.loading}>Loading messages...</div>
        ) : filteredMessages.length === 0 ? (
          <div style={styles.empty}>No messages found</div>
        ) : (
          <div style={styles.messagesList}>
            {filteredMessages.map(msg => (
              <div key={msg.id} style={styles.messageCard}>
                <div style={styles.messageHeader}>
                  <div>
                    <h3 style={styles.messageName}>{msg.name}</h3>
                    <p style={styles.messageEmail}>{msg.email}</p>
                  </div>
                  <div>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: subjectColors[msg.subject],
                      }}
                    >
                      {subjectLabels[msg.subject]}
                    </span>
                  </div>
                </div>

                {msg.organization && (
                  <p style={styles.messageOrg}>🏢 {msg.organization}</p>
                )}

                <p style={styles.messageBody}>{msg.message}</p>

                <div style={styles.messageFooter}>
                  <span style={styles.recipient}>
                    📨 To: {msg.recipientEmail}
                  </span>
                  <span style={styles.timestamp}>
                    {new Date(msg.timestamp).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 20px 0',
    color: '#1f2937',
  },
  stats: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  refreshBtn: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  filters: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  filterBtnActive: {
    backgroundColor: '#3b82f6',
    color: 'white',
    borderColor: '#3b82f6',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#9ca3af',
    fontSize: '16px',
  },
  messagesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  messageCard: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    transition: 'all 0.2s',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  messageName: {
    margin: '0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  messageEmail: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#6b7280',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
  },
  messageOrg: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    color: '#6b7280',
  },
  messageBody: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#374151',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  },
  messageFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#6b7280',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '12px',
  },
  recipient: {
    color: '#3b82f6',
  },
  timestamp: {
    color: '#9ca3af',
  },
};