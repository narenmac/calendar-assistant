interface Props {
  onSignIn: () => void;
  loading?: boolean;
}

export default function SignIn({ onSignIn, loading = false }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '52px 44px 40px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%',
      }}>
        {/* Icon */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 4px 16px rgba(26,115,232,0.35)',
        }}>
          <CalendarIcon />
        </div>

        <h1 style={{ margin: '0 0 8px', fontSize: '26px', fontWeight: 700, color: '#1a1a1a' }}>
          Calendar Assistant
        </h1>
        <p style={{ margin: '0 0 28px', color: '#6b7280', fontSize: '15px', lineHeight: '1.5' }}>
          Schedule meetings with natural language
        </p>

        {/* Feature list */}
        <ul style={{ listStyle: 'none', margin: '0 0 32px', padding: 0, textAlign: 'left' }}>
          {[
            'Type "Meet Sam tomorrow at 3pm" to book instantly',
            'Ask "What\'s on my calendar this week?" anytime',
            'Your token is never stored — secure by design',
          ].map((text) => (
            <li key={text} style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              marginBottom: '12px', color: '#374151', fontSize: '14px', lineHeight: '1.5',
            }}>
              <span style={{ color: '#1a73e8', fontWeight: 700, marginTop: '1px', flexShrink: 0 }}>✓</span>
              {text}
            </li>
          ))}
        </ul>

        {loading ? (
          <div style={{
            padding: '12px', color: '#6b7280', fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            <Spinner />
            Signing you in...
          </div>
        ) : (
          <button
            onClick={onSignIn}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              width: '100%', padding: '13px 20px',
              border: '1px solid #dadce0', borderRadius: '8px',
              background: '#fff', fontSize: '15px', fontWeight: 600,
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)', color: '#3c4043',
              cursor: 'pointer', transition: 'box-shadow 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.1)')}
          >
            <GoogleLogo />
            Sign in with Google
          </button>
        )}

        <p style={{ margin: '20px 0 0', color: '#9ca3af', fontSize: '12px' }}>
          We only access your calendar events. No data is stored on our servers.
        </p>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke="white" strokeWidth="2"/>
      <path d="M3 9h18" stroke="white" strokeWidth="2"/>
      <path d="M8 2v4M16 2v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="8" cy="13" r="1" fill="white"/>
      <circle cx="12" cy="13" r="1" fill="white"/>
      <circle cx="16" cy="13" r="1" fill="white"/>
      <circle cx="8" cy="17" r="1" fill="white"/>
      <circle cx="12" cy="17" r="1" fill="white"/>
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.107 17.64 11.8 17.64 9.2z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <circle cx="8" cy="8" r="6" stroke="#d1d5db" strokeWidth="2" fill="none"/>
      <path d="M8 2a6 6 0 0 1 6 6" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}
