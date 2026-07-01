import {call, put, select} from 'redux-saga/effects';

jest.mock('../../api/index', () => ({
  post: jest.fn(),
}));

jest.mock('../../api/services/fileUploadService', () => ({
  fileUploadService: {upload: jest.fn()},
}));

import client from '../../api/index';
import {fileUploadService} from '../../api/services/fileUploadService';
import {syncRecord, uploadRecordFiles, offlineSyncSaga} from './saga';
import {
  dequeueOfflineRecords,
  recordOfflineFailure,
  offlineSyncSuccess,
  offlineSyncFailure,
} from './actions';
import {OfflineRecord} from '../../types/offline';

const record: OfflineRecord = {
  id: 'rec-1',
  endpoint: 'addWork',
  baseUrl: 'WEB',
  payload: {note: 'hello'},
  files: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  retryCount: 0,
};

describe('syncRecord', () => {
  test('posts the payload and dequeues on success', () => {
    const gen = syncRecord(record);
    expect(gen.next().value).toEqual(
      call(
        [client, client.post],
        'https://preprodweb.blockbyblock.com/v1/offline/addWork',
        {note: 'hello'},
      ),
    );
    expect(gen.next().value).toEqual(put(dequeueOfflineRecords(['rec-1'])));
    const result = gen.next();
    expect(result.done).toBe(true);
    expect(result.value).toBe(true);
  });

  test('records a failure and does not dequeue when the request throws', () => {
    const gen = syncRecord(record);
    gen.next();
    const thrown = gen.throw!(new Error('network down'));
    expect(thrown.value).toEqual(put(recordOfflineFailure('rec-1')));
    const result = gen.next();
    expect(result.done).toBe(true);
    expect(result.value).toBe(false);
  });

  test('uploads files before posting when the record has attachments', () => {
    const recordWithFile: OfflineRecord = {
      ...record,
      files: [{fieldKey: 'image', uri: 'file:///photo.jpg', name: 'photo.jpg', type: 'image/jpeg'}],
    };
    const gen = syncRecord(recordWithFile);
    expect(gen.next().value).toEqual(call(uploadRecordFiles, recordWithFile));
    expect(
      gen.next({note: 'hello', image: 'https://cdn/x.jpg'}).value,
    ).toEqual(
      call(
        [client, client.post],
        'https://preprodweb.blockbyblock.com/v1/offline/addWork',
        {note: 'hello', image: 'https://cdn/x.jpg'},
      ),
    );
  });
});

describe('uploadRecordFiles', () => {
  test('replaces each file field with its uploaded url', () => {
    const recordWithFile: OfflineRecord = {
      ...record,
      files: [{fieldKey: 'image', uri: 'file:///photo.jpg', name: 'photo.jpg', type: 'image/jpeg'}],
    };
    const gen = uploadRecordFiles(recordWithFile);
    expect(gen.next().value).toEqual(
      call(fileUploadService.upload, recordWithFile.files[0]),
    );
    const result = gen.next('https://cdn/x.jpg');
    expect(result.value).toEqual({note: 'hello', image: 'https://cdn/x.jpg'});
    expect(result.done).toBe(true);
  });
});

describe('offlineSyncSaga', () => {
  test('skips records past the retry cap and reports success when nothing is left to sync', () => {
    const state = {offlineQueue: {pending: [{...record, retryCount: 5}]}};
    const gen = offlineSyncSaga();
    expect(gen.next().value).toEqual(select());
    expect(gen.next(state).value).toEqual(put(offlineSyncSuccess()));
    expect(gen.next().done).toBe(true);
  });

  test('reports failure when any syncable record fails', () => {
    const state = {offlineQueue: {pending: [record]}};
    const gen = offlineSyncSaga();
    expect(gen.next().value).toEqual(select());
    expect(gen.next(state).value).toEqual(call(syncRecord, record));
    expect(gen.next(false).value).toEqual(
      put(offlineSyncFailure('Some records failed to sync')),
    );
  });
});
