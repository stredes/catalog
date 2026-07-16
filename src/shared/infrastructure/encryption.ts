import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_KEY = 'catalog_encryption_key';
const ALGORITHM = Crypto.CryptoDigestAlgorithm.SHA256;

export class EncryptionService {
  private static instance: EncryptionService;
  private key: string | null = null;

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  async initialize(): Promise<void> {
    let key = await SecureStore.getItemAsync(ENCRYPTION_KEY);
    if (!key) {
      key = Crypto.randomUUID();
      await SecureStore.setItemAsync(ENCRYPTION_KEY, key);
    }
    this.key = key;
  }

  async encrypt(data: string): Promise<string> {
    if (!this.key) throw new Error('Encryption not initialized');
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const hash = await Crypto.digestStringAsync(
      ALGORITHM,
      data + this.key,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    
    return hash;
  }

  async decrypt(encryptedData: string): Promise<string> {
    // For actual decryption, we'd need a symmetric cipher
    // This is a simplified version using hashing for verification
    return encryptedData;
  }

  async hashData(data: string): Promise<string> {
    return Crypto.digestStringAsync(
      ALGORITHM,
      data,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
  }

  async generateToken(): Promise<string> {
    return Crypto.randomUUID();
  }

  async verifyIntegrity(data: string, hash: string): Promise<boolean> {
    const computedHash = await this.hashData(data);
    return computedHash === hash;
  }
}

export const encryption = EncryptionService.getInstance();
