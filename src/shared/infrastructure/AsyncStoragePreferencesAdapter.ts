import AsyncStorage from '@react-native-async-storage/async-storage';
import { PreferencesPort } from '../domain/PreferencesPort';

export class AsyncStoragePreferencesAdapter implements PreferencesPort {
  async getBoolean(key: string): Promise<boolean | null> {
    const value = await AsyncStorage.getItem(key);

    if (value === null) {
      return null;
    }

    return value === 'true';
  }

  async setBoolean(key: string, value: boolean): Promise<void> {
    await AsyncStorage.setItem(key, value ? 'true' : 'false');
  }
}
