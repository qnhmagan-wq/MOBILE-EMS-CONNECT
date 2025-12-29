import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

let ringtoneSound: Audio.Sound | null = null;
let vibrationInterval: NodeJS.Timeout | null = null;

/**
 * Play ringtone for incoming calls
 * Uses vibration and haptics as primary alert (no audio file needed)
 */
export const playRingtone = async (): Promise<void> => {
  try {
    console.log('[Ringtone] Starting ringtone (haptics-based)');

    // Note: We're using vibration/haptics as the primary alert
    // If you want actual audio, add a notification.mp3 file to /assets/sounds/
    // and uncomment the audio code below

    /*
    // Stop any existing ringtone first
    await stopRingtone();

    // Configure audio mode for incoming calls
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    // Create and play sound with looping
    const { sound } = await Audio.Sound.createAsync(
      require('@/assets/sounds/notification.mp3'),
      {
        isLooping: true,
        volume: 1.0,
        shouldPlay: true,
      }
    );

    ringtoneSound = sound;
    await sound.playAsync();
    */

    console.log('[Ringtone] Ringtone started (using vibration)');
  } catch (error: any) {
    console.error('[Ringtone] Play error:', error.message);
    // Don't throw - audio playback failure shouldn't block call
  }
};

/**
 * Stop ringtone playback
 */
export const stopRingtone = async (): Promise<void> => {
  try {
    if (ringtoneSound) {
      await ringtoneSound.stopAsync();
      await ringtoneSound.unloadAsync();
      ringtoneSound = null;
      console.log('[Ringtone] Stopped ringtone');
    }
  } catch (error: any) {
    console.error('[Ringtone] Stop error:', error.message);
  }
};

/**
 * Start vibration pattern for incoming calls
 * Vibrates in a repeating pattern until stopped
 */
export const startVibration = async (): Promise<void> => {
  try {
    // Stop any existing vibration
    stopVibration();

    // Initial vibration
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Set up repeating vibration pattern (every 1 second)
    vibrationInterval = setInterval(async () => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error('[Ringtone] Vibration error:', error);
      }
    }, 1000);

    console.log('[Ringtone] Started vibration');
  } catch (error: any) {
    console.error('[Ringtone] Start vibration error:', error.message);
  }
};

/**
 * Stop vibration pattern
 */
export const stopVibration = (): void => {
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
    console.log('[Ringtone] Stopped vibration');
  }
};

/**
 * Stop both ringtone and vibration
 * Convenience method for cleanup
 */
export const stopAll = async (): Promise<void> => {
  await stopRingtone();
  stopVibration();
};
