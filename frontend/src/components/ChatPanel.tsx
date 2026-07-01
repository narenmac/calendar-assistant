import { useEffect, useRef, useState } from 'react';
import { scheduleRequest } from '../api/client';
import { Message } from '../types';

interface Props {
  accessToken: string;
  onAssistantReply: () => void;
}

export default function ChatPanel({ accessToken, onAssistantReply }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const reply = await scheduleRequest(text, accessToken);
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      onAssistantReply(); // trigger events panel refresh after any reply
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff',
      overflow: 'hidden', minHeight: 0,
    }}>
      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '14px',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        {messages.length === 0 && (
          <div style={{ color: '#aaa', fontSize: '14px', textAlign: 'center', marginTop: '24px' }}>
            Try: "Schedule a meeting with Sam tomorrow at 3pm"
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '75%', padding: '9px 13px', borderRadius: '14px', fontSize: '14px',
              lineHeight: '1.55', whiteSpace: 'pre-wrap',
              background: m.role === 'user' ? '#1a73e8' : '#f1f3f4',
              color: m.role === 'user' ? '#fff' : '#1a1a1a',
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '9px 13px', borderRadius: '14px', fontSize: '14px',
              background: '#f1f3f4', color: '#888',
            }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: '10px 12px', borderTop: '1px solid #e0e0e0',
        display: 'flex', gap: '8px', background: '#fff',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
          placeholder="Type a message..."
          disabled={loading}
          style={{
            flex: 1, padding: '9px 12px', border: '1px solid #dadce0', borderRadius: '6px',
            fontSize: '14px', outline: 'none', color: '#1a1a1a',
          }}
        />
        <button
          onClick={() => void send()}
          disabled={loading || !input.trim()}
          style={{
            padding: '9px 18px', background: '#1a73e8', color: '#fff',
            border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500,
            opacity: loading || !input.trim() ? 0.55 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
