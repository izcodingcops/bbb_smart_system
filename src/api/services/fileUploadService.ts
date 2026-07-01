import client from '../index';
import {ApiEndpoints} from '../apiEndpoints';
import {OfflineFile} from '../../types/offline';

interface UploadFileResponse {
  status: number;
  data: {url: string};
}

export const fileUploadService = {
  upload: (file: OfflineFile): Promise<string> => {
    const form = new FormData();
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);

    return client
      .post<UploadFileResponse>(ApiEndpoints.uploadFile, form, {
        headers: {'Content-Type': 'multipart/form-data'},
      })
      .then(response => response.data.data.url);
  },
};
