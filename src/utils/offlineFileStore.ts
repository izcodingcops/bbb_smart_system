import RNFS from 'react-native-fs';
import {OfflineFile} from '../types/offline';
import {generateId} from './generateId';
import {logger} from './logger';

const OFFLINE_FILES_DIR = `${RNFS.DocumentDirectoryPath}/offline-files`;

async function ensureOfflineFilesDir(): Promise<void> {
  const exists = await RNFS.exists(OFFLINE_FILES_DIR);
  if (!exists) {
    await RNFS.mkdir(OFFLINE_FILES_DIR);
  }
}

function stripFileScheme(uri: string): string {
  return uri.startsWith('file://') ? uri.slice('file://'.length) : uri;
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot);
}

/**
 * Copies a picked file (image or document) out of the OS's volatile picker
 * cache into the app's own Documents directory, returning an OfflineFile
 * pointing at the durable copy. Queued offline records must reference a
 * path that survives until the device comes back online and the record is
 * synced — picker URIs can be invalidated by the OS before that happens.
 */
export async function persistOfflineFile(file: OfflineFile): Promise<OfflineFile> {
  await ensureOfflineFilesDir();
  const destPath = `${OFFLINE_FILES_DIR}/${generateId()}${extensionOf(file.name)}`;
  await RNFS.copyFile(stripFileScheme(file.uri), destPath);
  return {...file, uri: `file://${destPath}`};
}

export async function deletePersistedOfflineFile(uri: string): Promise<void> {
  const path = stripFileScheme(uri);
  try {
    const exists = await RNFS.exists(path);
    if (exists) {
      await RNFS.unlink(path);
    }
  } catch (error) {
    logger.warn('OfflineFileStore', `Failed to delete persisted file ${path}`, error);
  }
}
