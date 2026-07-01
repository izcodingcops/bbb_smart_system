import {fileUploadService} from './fileUploadService';
import client from '../index';

jest.mock('../index', () => ({
  post: jest.fn(),
}));

describe('fileUploadService.upload', () => {
  test('posts multipart form data and returns the uploaded url', async () => {
    (client.post as jest.Mock).mockResolvedValue({
      data: {status: 200, data: {url: 'https://cdn.example.com/file.jpg'}},
    });

    const url = await fileUploadService.upload({
      fieldKey: 'image',
      uri: 'file:///tmp/photo.jpg',
      name: 'photo.jpg',
      type: 'image/jpeg',
    });

    expect(url).toBe('https://cdn.example.com/file.jpg');
    expect(client.post).toHaveBeenCalledWith(
      'work/uploadFile',
      expect.any(FormData),
      {headers: {'Content-Type': 'multipart/form-data'}},
    );
  });
});
