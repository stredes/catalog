import * as SecureStore from 'expo-secure-store';
import { encryption } from './encryption';

const SESSION_KEY = 'catalog_session';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export interface Session {
  token: string;
  userId: string;
  role: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
}

export interface LoginAttempt {
  timestamp: number;
  success: boolean;
}

export class SessionService {
  private static instance: SessionService;
  private session: Session | null = null;
  private loginAttempts: LoginAttempt[] = [];

  private constructor() {}

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  async initialize(): Promise<void> {
    await encryption.initialize();
    await this.loadSession();
    await this.loadLoginAttempts();
  }

  private async loadSession(): Promise<void> {
    const sessionData = await SecureStore.getItemAsync(SESSION_KEY);
    if (sessionData) {
      this.session = JSON.parse(sessionData);
      if (this.isSessionExpired()) {
        await this.clearSession();
      }
    }
  }

  private async loadLoginAttempts(): Promise<void> {
    const attemptsData = await SecureStore.getItemAsync('login_attempts');
    if (attemptsData) {
      this.loginAttempts = JSON.parse(attemptsData);
      this.cleanOldAttempts();
    }
  }

  private isSessionExpired(): boolean {
    if (!this.session) return true;
    return Date.now() > this.session.expiresAt;
  }

  private cleanOldAttempts(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.loginAttempts = this.loginAttempts.filter(
      attempt => attempt.timestamp > oneHourAgo
    );
  }

  private getRecentFailedAttempts(): number {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return this.loginAttempts.filter(
      attempt => !attempt.success && attempt.timestamp > fiveMinutesAgo
    ).length;
  }

  isLockedOut(): boolean {
    return this.getRecentFailedAttempts() >= MAX_LOGIN_ATTEMPTS;
  }

  getLockoutTimeRemaining(): number {
    if (!this.isLockedOut()) return 0;
    
    const lastFailedAttempt = this.loginAttempts
      .filter(a => !a.success)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (!lastFailedAttempt) return 0;
    
    const lockoutEnd = lastFailedAttempt.timestamp + LOCKOUT_DURATION;
    return Math.max(0, lockoutEnd - Date.now());
  }

  async login(userId: string, role: string): Promise<boolean> {
    if (this.isLockedOut()) {
      return false;
    }

    const token = await encryption.generateToken();
    const now = Date.now();

    this.session = {
      token,
      userId,
      role,
      createdAt: now,
      expiresAt: now + SESSION_TIMEOUT,
      lastActivity: now,
    };

    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(this.session));
    
    this.loginAttempts.push({ timestamp: now, success: true });
    await SecureStore.setItemAsync('login_attempts', JSON.stringify(this.loginAttempts));

    return true;
  }

  async logout(): Promise<void> {
    await this.clearSession();
  }

  private async clearSession(): Promise<void> {
    this.session = null;
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }

  async extendSession(): Promise<void> {
    if (!this.session || this.isSessionExpired()) {
      return;
    }

    this.session.lastActivity = Date.now();
    this.session.expiresAt = Date.now() + SESSION_TIMEOUT;
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(this.session));
  }

  getSession(): Session | null {
    if (this.isSessionExpired()) {
      return null;
    }
    return this.session;
  }

  isAuthenticated(): boolean {
    return this.session !== null && !this.isSessionExpired();
  }

  hasRole(role: string): boolean {
    return this.session?.role === role;
  }

  async recordFailedLogin(): Promise<void> {
    this.loginAttempts.push({ timestamp: Date.now(), success: false });
    await SecureStore.setItemAsync('login_attempts', JSON.stringify(this.loginAttempts));
  }
}

export const session = SessionService.getInstance();
