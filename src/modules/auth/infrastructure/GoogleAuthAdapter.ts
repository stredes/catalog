import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AuthPort, User } from '../domain/AuthPort';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  offlineAccess: true,
});

export class GoogleAuthAdapter implements AuthPort {
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await GoogleSignin.signInSilently();
      if (response.type !== 'success') {
        return null;
      }
      return {
        id: response.data.user.id,
        email: response.data.user.email,
        name: response.data.user.name ?? '',
        photo: response.data.user.photo ?? undefined,
      };
    } catch {
      return null;
    }
  }

  async signIn(): Promise<User> {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (response.type !== 'success') {
      throw new Error('Login cancelled');
    }
    return {
      id: response.data.user.id,
      email: response.data.user.email,
      name: response.data.user.name ?? '',
      photo: response.data.user.photo ?? undefined,
    };
  }

  async signOut(): Promise<void> {
    await GoogleSignin.signOut();
  }
}
