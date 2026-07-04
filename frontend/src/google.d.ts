// Type declarations for Google Identity Services (loaded via <script> in index.html)
interface TokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface TokenResponse {
  access_token: string;
  error?: string;
}

declare const google: {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        prompt?: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: { type: string }) => void;
      }) => TokenClient;
      revoke: (token: string, callback: () => void) => void;
    };
  };
};
