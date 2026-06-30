import { Platform } from 'react-native';

let SecureStore: any = null;

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  if (!SecureStore) {
    SecureStore = require('expo-secure-store');
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  if (!SecureStore) {
    SecureStore = require('expo-secure-store');
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  if (!SecureStore) {
    SecureStore = require('expo-secure-store');
  }
  await SecureStore.deleteItemAsync(key);
}
