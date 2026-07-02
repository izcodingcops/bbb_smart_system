import {mockFileUploadService} from './mockFileUploadService';

describe('mockFileUploadService.upload', () => {
  test('resolves a url containing the uploaded file name', async () => {
    const url = await mockFileUploadService.upload({
      fieldKey: 'image',
      uri: 'file:///tmp/photo.jpg',
      name: 'photo.jpg',
      type: 'image/jpeg',
    });

    expect(url).toContain('photo.jpg');
    expect(url.startsWith('https://')).toBe(true);
  });
});
