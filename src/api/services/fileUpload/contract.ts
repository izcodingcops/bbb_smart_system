import {OfflineFile} from '../../../types/offline';

export interface FileUploadServiceContract {
  upload: (file: OfflineFile) => Promise<string>;
}
