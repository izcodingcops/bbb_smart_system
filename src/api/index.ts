import axios from 'axios';
import {Platform} from 'react-native';
import DeviceInfo, {
  getBuildNumber,
  getDeviceId,
  getModel,
} from 'react-native-device-info';
import {MicroService} from './microService';
import {toCurl} from './curlPrinter';
import {logger} from '../utils/logger';
import {getActiveProgramId} from './headerContext';

const client = axios.create({
  baseURL: MicroService.BASE_APP_API,
  timeout: 30000,
  headers: {Accept: 'application/json'},
});

/**
 * Some backend endpoints (notably /shifts/add) hang indefinitely when the
 * full header set is missing — they wait on values like device_id and
 * latitude/longitude inside server-side validation. The old app sent this
 * exact bag of headers on every request; we mirror it here to match.
 *
 * Device-info getters that are async (getDeviceName, getUniqueId,
 * getSystemVersion, getManufacturer) are looked up once and cached because
 * they never change for a session.
 */
let cachedDevice: {
  name: string;
  uniqueId: string;
  systemVersion: string;
  manufacturer: string;
} | null = null;

async function getDeviceCached() {
  if (cachedDevice) return cachedDevice;
  try {
    const [name, uniqueId, systemVersion, manufacturer] = await Promise.all([
      DeviceInfo.getDeviceName(),
      DeviceInfo.getUniqueId(),
      DeviceInfo.getSystemVersion(),
      DeviceInfo.getManufacturer(),
    ]);
    cachedDevice = {name, uniqueId, systemVersion, manufacturer};
  } catch {
    cachedDevice = {name: '', uniqueId: '', systemVersion: '', manufacturer: ''};
  }
  return cachedDevice;
}

client.interceptors.request.use(async config => {
  const {store} = require('../redux/store');
  const state = store.getState();

  const token: string | undefined = state.auth?.session?.token;
  // Prefer redux state (set after a successful program selection). If that's
  // still null (e.g. start-shift call that must populate the header BEFORE
  // navigation commits), fall back to the transient override.
  const programId =
    state.program?.selectedProgram?.id ?? getActiveProgramId() ?? '';
  const loc = state.location?.currentLocation;

  const device = await getDeviceCached();

  config.headers = {
    ...(config.headers as Record<string, unknown>),
    Accept: 'application/json',
    Authorization: token ?? '',
    device_build_number: getBuildNumber(),
    device_os: Platform.OS,
    device_name: device.name,
    device_id: getDeviceId(),
    os_version: device.systemVersion,
    language_id: 1,
    token_type: '',
    fcm_token: '', // not yet wired — confirmed unnecessary for /shifts/add
    unique_device_id: device.uniqueId,
    latitude: loc?.latitude ?? '',
    longitude: loc?.longitude ?? '',
    device_manufacture: device.manufacturer,
    device_model: getModel(),
    program_id: programId,
    altitude: loc?.altitude ?? '',
    heading: loc?.heading ?? '',
    heading_accuracy: '0.000000',
    vertical_accuracy: loc?.verticalAccuracy ?? '',
    horizontal_accuracy: loc?.horizontalAccuracy ?? '',
  } as any;

  if (__DEV__) {
    logger.debug('API', `→ ${(config.method ?? 'GET').toUpperCase()} ${config.url}`);
    // eslint-disable-next-line no-console
    console.log(`\n${toCurl(config)}\n`);
  }

  return config;
});

client.interceptors.response.use(
  response => {
    if (__DEV__) {
      logger.debug(
        'API',
        `← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
      );
    }
    return response;
  },
  error => {
    const status = error.response?.status;
    if (__DEV__) {
      logger.debug(
        'API',
        `✖ ${status ?? 'ERR'} ${error.config?.method?.toUpperCase()} ${error.config?.url} — ${error.message}`,
      );
    }
    if (status === 401 || status === 403) {
      const {store} = require('../redux/store');
      const {logout} = require('../redux/auth/actions');
      store.dispatch(logout());
    }
    return Promise.reject(error);
  },
);

export default client;
