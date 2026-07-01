// Type declarations for Google Identity Services (loaded via <script> in index.html)
interface TokenClient {
  requestAccessToken: () => void;
}

interface TokenResponse {
  access_token: string;
}

declare const google: {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
      }) => TokenClient;
      revoke: (token: string, callback: () => void) => void;
    };
  };
};
