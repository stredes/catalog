export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthPort {
  getCurrentUser(): Promise<User | null>;
  login(email: string, password: string): Promise<User>;
  register(email: string, password: string, name: string): Promise<User>;
  logout(): Promise<void>;
}
