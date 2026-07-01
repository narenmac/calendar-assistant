interface Props {
  onSignIn: () => void;
}

export default function SignIn({ onSignIn }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: '20px', background: '#f8f9fa',
    }}>
      <h1 style={{ margin: 0, fontSize: '24px', color: '#1a1a1a' }}>Calendar Assistant</h1>
      <p style={{ margin: 0, color: '#666', fontSize: '15px' }}>
        Schedule meetings with natural language
      </p>
      <button
        onClick={onSignIn}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '11px 22px', border: '1px solid #dadce0', borderRadius: '6px',
          background: '#fff', fontSize: '15px', fontWeight: 500,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#3c4043',
        }}
      >
        <GoogleLogo />
        Sign in with Google
      </button>
    </div>
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
