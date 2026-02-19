'use client';

import { useEffect, useState } from 'react';
import Head from 'next/head';

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

export default function MessagesViewer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      // Lire directement de public/.data/contacts.json
      const res = await fetch('/.data/contacts.json');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.sort((a: Message, b: Message) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
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
    api: '🔌 API Access',
    support: '💬 Support',
    legal: '⚖️ Legal',
    privacy: '🔒 Privacy',
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
        <title>Messages Dashboard - GTIXT Admin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.title}>📧 Contact Messages Dashboard</h1>
            <p style={styles.subtitle}>View all contact form submissions</p>
          </div>

          <div style={styles.stats}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{messages.length}</div>
              <div style={styles.statLabel}>Total Messages</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{messages.filter(m => m.subject === 'support').length}</div>
              <div style={styles.statLabel}>Support</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{messages.filter(m => m.subject === 'api').length}</div>
              <div style={styles.statLabel}>API</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{messages.filter(m => m.subject === 'legal').length}</div>
              <div style={styles.statLabel}>Legal</div>
            </div>
          </div>

          <div style={styles.filters}>
            {['all', 'support', 'api', 'legal', 'privacy'].map(subject => {
              const count = subject === 'all' 
                ? messages.length 
                : messages.filter(m => m.subject === subject).length;
              return (
                <button
                  key={subject}
                  onClick={() => setFilter(subject)}
                  style={{
                    ...styles.filterBtn,
                    ...(filter === subject && styles.filterBtnActive),
                  }}
                >
                  {subject === 'all' ? '📋 All' : subjectLabels[subject]} ({count})
                </button>
              );
            })}
            <button onClick={fetchMessages} style={styles.refreshBtn}>
              🔄 Refresh Now
            </button>
          </div>

          {loading ? (
            <div style={styles.loading}>⏳ Loading messages...</div>
          ) : filteredMessages.length === 0 ? (
            <div style={styles.empty}>No messages found</div>
          ) : (
            <div style={styles.messagesList}>
              {filteredMessages.map(msg => (
                <div key={msg.id} style={styles.messageCard}>
                  <div style={styles.cardTop}>
                    <div style={styles.contactInfo}>
                      <h3 style={styles.contactName}>{msg.name}</h3>
                      <p style={styles.contactEmail}>📧 {msg.email}</p>
                      {msg.organization && (
                        <p style={styles.contactOrg}>🏢 {msg.organization}</p>
                      )}
                    </div>
                    <div style={{
                      ...styles.subjectBadge,
                      backgroundColor: subjectColors[msg.subject],
                    }}>
                      {subjectLabels[msg.subject] || msg.subject}
                    </div>
                  </div>

                  <div style={styles.messageContent}>
                    <p style={styles.messageText}>{msg.message}</p>
                  </div>

                  <div style={styles.cardFooter}>
                    <span style={styles.recipient}>📨 → {msg.recipientEmail}</span>
                    <span style={styles.timestamp}>⏰ {new Date(msg.timestamp).toLocaleString('fr-FR')}</span>
                    <span style={styles.id}>{msg.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={styles.footer}>
            <p style={styles.footerText}>
              💾 Messages are auto-saved to <code>/public/.data/contacts.json</code>
            </p>
            <p style={styles.footerText}>
              📨 Emails are sent to specified recipients based on category
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    backgroundColor: '#f3f4f6',
    minHeight: '100vh',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '40px',
    textAlign: 'center',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: '0',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500',
  },
  filters: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '10px 16px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  filterBtnActive: {
    backgroundColor: '#3b82f6',
    color: 'white',
    borderColor: '#3b82f6',
  },
  refreshBtn: {
    padding: '10px 16px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280',
    fontSize: '18px',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    color: '#9ca3af',
    fontSize: '16px',
  },
  messagesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '40px',
  },
  messageCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'all 0.2s',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
    gap: '16px',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  contactEmail: {
    margin: '4px 0',
    fontSize: '13px',
    color: '#6b7280',
  },
  contactOrg: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  subjectBadge: {
    display: 'inline-block',
    padding: '6px 16px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    whiteSpace: 'nowrap',
  },
  messageContent: {
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
  },
  messageText: {
    margin: '0',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#374151',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: '#f9fafb',
    fontSize: '12px',
    color: '#6b7280',
    flexWrap: 'wrap',
    gap: '10px',
  },
  recipient: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  timestamp: {
    color: '#9ca3af',
  },
  id: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#d1d5db',
  },
  footer: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  footerText: {
    margin: '8px 0',
    fontSize: '13px',
    color: '#6b7280',
  },
};
