import { useState } from 'react';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import SignIn from './components/SignIn';
import Header from './components/Header';
import EventsPanel from './components/EventsPanel';
import ChatPanel from './components/ChatPanel';

export default function App() {
  const { accessToken, userInfo, signIn, signOut, autoSigningIn } = useGoogleAuth();
  // Incrementing this triggers EventsPanel to re-fetch after the assistant replies
  const [eventsRefreshKey, setEventsRefreshKey] = useState(0);

  if (!accessToken) {
    return <SignIn onSignIn={signIn} loading={autoSigningIn} />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header userInfo={userInfo} onSignOut={signOut} />
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        gap: '12px', padding: '12px', overflow: 'hidden',
      }}>
        <EventsPanel
          accessToken={accessToken}
          refreshKey={eventsRefreshKey}
        />
        <ChatPanel
          accessToken={accessToken}
          onAssistantReply={() => setEventsRefreshKey(k => k + 1)}
        />
      </div>
    </div>
  );
}
