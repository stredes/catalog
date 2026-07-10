import * as Crypto from 'expo-crypto';
import { AuthPort, User } from '../domain/AuthPort';
import { PreferencesPort } from '../../../shared/domain/PreferencesPort';

const USER_KEY = 'catalog_clean_user';
const USERS_KEY = 'catalog_clean_users';

interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export class LocalAuthAdapter implements AuthPort {
  constructor(private preferences: PreferencesPort) {}

  async getCurrentUser(): Promise<User | null> {
    const data = await this.preferences.getString(USER_KEY);
    if (!data) return null;
    return JSON.parse(data);
  }

  async login(email: string, password: string): Promise<User> {
    const users = await this.getUsers();
    const user = users.find((u) => u.email === email.toLowerCase());

    if (!user) {
      throw new Error('Email no registrado');
    }

    const hash = await this.hashPassword(password);
    if (user.passwordHash !== hash) {
      throw new Error('Contraseña incorrecta');
    }

    const loggedIn: User = { id: user.id, email: user.email, name: user.name };
    await this.preferences.setString(USER_KEY, JSON.stringify(loggedIn));
    return loggedIn;
  }

  async register(email: string, password: string, name: string): Promise<User> {
    const users = await this.getUsers();
    const exists = users.find((u) => u.email === email.toLowerCase());

    if (exists) {
      throw new Error('El email ya está registrado');
    }

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const passwordHash = await this.hashPassword(password);

    const newUser: StoredUser = {
      id,
      email: email.toLowerCase(),
      name,
      passwordHash,
    };

    users.push(newUser);
    await this.preferences.setString(USERS_KEY, JSON.stringify(users));

    const loggedUser: User = { id, email: newUser.email, name };
    await this.preferences.setString(USER_KEY, JSON.stringify(loggedUser));
    return loggedUser;
  }

  async logout(): Promise<void> {
    await this.preferences.setString(USER_KEY, '');
  }

  private async getUsers(): Promise<StoredUser[]> {
    const data = await this.preferences.getString(USERS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  }

  private async hashPassword(password: string): Promise<string> {
    return Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + 'catalog_clean_salt',
    );
  }
}
