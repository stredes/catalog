export interface User {
  id: string;
  email: string;
  name: string;
  photo?: string;
}

export interface AuthPort {
  getCurrentUser(): Promise<User | null>;
  signIn(): Promise<User>;
  signOut(): Promise<void>;
}
