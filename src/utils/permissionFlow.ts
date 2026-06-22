import {Alert, Platform} from 'react-native';
import {locationTracker, PermissionStatus} from './locationTracker';
import {logger} from './logger';

const TAG = 'PermissionFlow';

type Decision = 'continue' | 'abort';

/**
 * Walks the user through every missing GPS-related permission stage, showing
 * an explainer Alert before each runtime prompt or Settings deep-link.
 *
 * Returns true iff every required permission is granted by the time the
 * function returns.
 */
export async function ensurePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true; // iOS handled elsewhere
  // Bounded loop in case the user bounces between stages — never spin forever.
  for (let i = 0; i < 8; i++) {
    const status = await locationTracker.getPermissionStatus();
    logger.info(TAG, `status=${status}`);
    if (status === 'ok') return true;

    const decision = await handle(status);
    if (decision === 'abort') return false;

    // After a Settings deep-link the next status check happens on next loop
    // iteration. handle() awaits onAppResumed for us in those branches.
  }
  logger.warn(TAG, 'permission loop bound exceeded');
  return false;
}

async function handle(status: PermissionStatus): Promise<Decision> {
  switch (status) {
    case 'services_off':
      return explainAndSettings(
        'Turn on Location',
        'Location services are turned off on your device. Tap "Open Settings" and switch Location on, then come back.',
        () => locationTracker.openLocationSettings(),
      );

    case 'fine_denied':
      return explainAndPrompt(
        'Allow Location Access',
        'We need location access to track your shift. On the next screen, tap "While using the app" or "Allow only this time".',
        () => locationTracker.requestStage('fine'),
      );

    case 'fine_blocked':
      return explainAndSettings(
        'Location Permission Blocked',
        'Location was previously denied. Tap "Open Settings", then go to Permissions → Location → choose at least "Allow only while using the app".',
        () => locationTracker.openAppSettings(),
      );

    case 'background_denied':
      // Pre-Android-11 only — inline prompt is still possible.
      return explainAndPrompt(
        'Allow Background Location',
        'To keep tracking when the app is in the background, please choose "Allow all the time" on the next screen.',
        () => locationTracker.requestStage('background'),
      );

    case 'background_blocked':
    case 'background_settings_only':
      return explainAndSettings(
        'Allow Location All the Time',
        'Android requires you to enable background location from system settings. ' +
          'Tap "Open Settings" → Permissions → Location → pick "Allow all the time".',
        () => locationTracker.openAppSettings(),
      );

    case 'activity_denied':
      return explainAndPrompt(
        'Allow Physical Activity Access',
        'We use motion detection to save battery while tracking. Please tap "Allow" on the next screen.',
        () => locationTracker.requestStage('activity'),
      );

    case 'activity_blocked':
      return explainAndSettings(
        'Physical Activity Blocked',
        'Tap "Open Settings", then Permissions → Physical activity → Allow.',
        () => locationTracker.openAppSettings(),
      );

    default:
      logger.warn(TAG, `unhandled status ${status}`);
      return 'abort';
  }
}

/**
 * Show an explainer; on Continue, fire the runtime prompt and await its
 * (true) Promise result. Returns 'continue' so the outer loop re-reads status.
 */
function explainAndPrompt(
  title: string,
  message: string,
  fire: () => Promise<boolean>,
): Promise<Decision> {
  return new Promise(resolve => {
    Alert.alert(title, message, [
      {text: 'Cancel', style: 'cancel', onPress: () => resolve('abort')},
      {
        text: 'Continue',
        onPress: async () => {
          try {
            await fire();
          } catch (e) {
            logger.error(TAG, 'requestStage failed', e);
          }
          resolve('continue');
        },
      },
    ]);
  });
}

/**
 * Show an explainer; on Open Settings, deep-link to settings and wait for the
 * app to be resumed before re-checking status. Cancel aborts.
 */
function explainAndSettings(
  title: string,
  message: string,
  open: () => void,
): Promise<Decision> {
  return new Promise(resolve => {
    Alert.alert(title, message, [
      {text: 'Cancel', style: 'cancel', onPress: () => resolve('abort')},
      {
        text: 'Open Settings',
        onPress: () => {
          const off = locationTracker.onAppResumed(() => {
            off();
            resolve('continue');
          });
          open();
        },
      },
    ]);
  });
}
