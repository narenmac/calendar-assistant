import { useEffect, useState } from 'react';
import { fetchEvents } from '../api/client';

interface Props {
  accessToken: string;
  refreshKey: number;
}

export default function EventsPanel({ accessToken, refreshKey }: Props) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchEvents(accessToken)
      .then(setContent)
      .catch((e: Error) => setContent(`Could not load events: ${e.message}`))
      .finally(() => setLoading(false));
  }, [accessToken, refreshKey]);

  return (
    <div style={{
      border: '1px solid #e0e0e0', borderRadius: '8px', padding: '14px',
      background: '#fff', maxHeight: '220px', overflowY: 'auto', flexShrink: 0,
    }}>
      <div style={{ fontWeight: 600, fontSize: '13px', color: '#444', marginBottom: '10px' }}>
        Upcoming Events
      </div>
      <div style={{
        fontSize: '14px', color: '#555', whiteSpace: 'pre-wrap',
        lineHeight: '1.65', minHeight: '40px',
      }}>
        {loading ? 'Loading...' : (content || 'No upcoming events.')}
      </div>
    </div>
  );
}
