export interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export interface UserInfo {
  name: string;
  email: string;
}
