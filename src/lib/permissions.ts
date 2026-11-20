import { PermissionsAndroid, Platform } from 'react-native';

/** Asks for music-file access (READ_MEDIA_AUDIO on Android 13+, storage before that). */
export async function requestAudioPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const perm =
    Number(Platform.Version) >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO
      : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
  const r = await PermissionsAndroid.request(perm);
  return r === PermissionsAndroid.RESULTS.GRANTED;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 33) return true;
  const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  return r === PermissionsAndroid.RESULTS.GRANTED;
}
