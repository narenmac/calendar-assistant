import { UserInfo } from '../types';

interface Props {
  userInfo: UserInfo | null;
  onSignOut: () => void;
}

export default function Header({ userInfo, onSignOut }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderBottom: '1px solid #e0e0e0', background: '#fff',
    }}>
      <span style={{ fontWeight: 600, fontSize: '16px', color: '#1a1a1a' }}>
        Calendar Assistant
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {userInfo && (
          <span style={{ fontSize: '13px', color: '#555' }}>{userInfo.name}</span>
        )}
        <button
          onClick={onSignOut}
          style={{
            padding: '5px 12px', border: '1px solid #dadce0', borderRadius: '4px',
            background: '#fff', fontSize: '13px', color: '#3c4043',
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
