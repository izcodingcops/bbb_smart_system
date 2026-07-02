import {generateId} from '../../utils/generateId';
import {OfflineFile} from '../../types/offline';
import {FileUploadServiceContract} from './contracts';

const MOCK_DELAY = 400;

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
}

export const mockFileUploadService = {
  upload: (file: OfflineFile): Promise<string> =>
    delay(`https://mock-cdn.example.com/${generateId()}-${file.name}`),
} satisfies FileUploadServiceContract;
