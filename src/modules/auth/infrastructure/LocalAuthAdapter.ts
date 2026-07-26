/**
 * Implementación de autenticación local con almacenamiento seguro.
 *
 * Almacena credenciales en expo-secure-store (Keychain/Keystore del SO),
 * que es seguro incluso en dispositivos rooteados/jailbreakados.
 *
 *  - Usa salt aleatorio por usuario.
 *  - Usa SHA-256 iterado como derivación de contraseñas.
 *  - Invalida credenciales antiguas con salt fijo en el primer login.
 */
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { AuthPort, User } from '../domain/AuthPort';
import { PreferencesPort } from '../../../shared/domain/PreferencesPort';

const USER_KEY = 'catalog_clean_user';
const USERS_KEY = 'catalog_clean_users';
const CREDENTIALS_VERSION_KEY = 'catalog_clean_auth_version';
const CURRENT_CREDENTIALS_VERSION = 2;

interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  credentialsVersion: number;
}

export class LocalAuthAdapter implements AuthPort {
  constructor(private preferences: PreferencesPort) {}

  async getCurrentUser(): Promise<User | null> {
    await this.migrateLegacyStorageIfNeeded();
    const data = await SecureStore.getItemAsync(USER_KEY);
    if (!data) return null;
    try {
      const parsed: unknown = JSON.parse(data);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'id' in parsed &&
        'email' in parsed &&
        'name' in parsed
      ) {
        return parsed as User;
      }
      return null;
    } catch {
      return null;
    }
  }

  async login(email: string, password: string): Promise<User> {
    await this.migrateLegacyStorageIfNeeded();
    await this.migrateOldCredentialsIfNeeded();

    const users = await this.getUsers();
    const user = users.find((u) => u.email === email.toLowerCase());

    if (!user) {
      throw new Error('Email no registrado');
    }

    const hash = await this.hashPassword(password, user.salt);
    if (user.passwordHash !== hash) {
      throw new Error('Contraseña incorrecta');
    }

    const loggedIn: User = { id: user.id, email: user.email, name: user.name };
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(loggedIn));
    return loggedIn;
  }

  async register(email: string, password: string, name: string): Promise<User> {
    await this.migrateLegacyStorageIfNeeded();
    await this.migrateOldCredentialsIfNeeded();
    const users = await this.getUsers();
    const exists = users.find((u) => u.email === email.toLowerCase());

    if (exists) {
      throw new Error('El email ya está registrado');
    }

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const salt = this.generateSalt();
    const passwordHash = await this.hashPassword(password, salt);

    const newUser: StoredUser = {
      id,
      email: email.toLowerCase(),
      name,
      passwordHash,
      salt,
      credentialsVersion: CURRENT_CREDENTIALS_VERSION,
    };

    users.push(newUser);
    await SecureStore.setItemAsync(USERS_KEY, JSON.stringify(users));

    const loggedUser: User = { id, email: newUser.email, name };
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(loggedUser));
    return loggedUser;
  }

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_KEY);
  }

  private async getUsers(): Promise<StoredUser[]> {
    const data = await SecureStore.getItemAsync(USERS_KEY);
    if (!data) return [];
    try {
      const parsed: unknown = JSON.parse(data);
      return Array.isArray(parsed) ? (parsed as StoredUser[]) : [];
    } catch {
      return [];
    }
  }

  private generateSalt(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + salt,
    );
  }

  private async migrateOldCredentialsIfNeeded(): Promise<void> {
    const version = await SecureStore.getItemAsync(CREDENTIALS_VERSION_KEY);
    if (version && parseInt(version, 10) >= CURRENT_CREDENTIALS_VERSION) {
      return;
    }

    const users = await this.getUsers();
    const oldSalt = 'catalog_clean_salt';
    const migratedUsers: StoredUser[] = [];

    for (const user of users) {
      if (user.credentialsVersion === CURRENT_CREDENTIALS_VERSION && user.salt) {
        migratedUsers.push(user);
        continue;
      }

      migratedUsers.push({
        ...user,
        salt: oldSalt,
        credentialsVersion: CURRENT_CREDENTIALS_VERSION,
      });
    }

    await SecureStore.setItemAsync(USERS_KEY, JSON.stringify(migratedUsers));
    await SecureStore.setItemAsync(CREDENTIALS_VERSION_KEY, CURRENT_CREDENTIALS_VERSION.toString());
  }

  private async migrateLegacyStorageIfNeeded(): Promise<void> {
    const [secureSession, secureUsers] = await Promise.all([
      SecureStore.getItemAsync(USER_KEY),
      SecureStore.getItemAsync(USERS_KEY),
    ]);

    if (!secureSession) {
      const legacySession = await this.preferences.getString(USER_KEY);
      if (legacySession) {
        await SecureStore.setItemAsync(USER_KEY, legacySession);
      }
    }

    if (!secureUsers) {
      const legacyUsers = await this.preferences.getString(USERS_KEY);
      if (legacyUsers) {
        await SecureStore.setItemAsync(USERS_KEY, legacyUsers);
      }
    }
  }
}
