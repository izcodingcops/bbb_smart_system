import {LocationServiceContract, GeoDataBody} from './contracts';

const MOCK_DELAY = 150;

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
}

export const mockLocationService = {
  addGeoData: (body: GeoDataBody) =>
    delay({status: 200, data: {sessionId: body.sessionId, shiftId: body.shiftId}}),
} satisfies LocationServiceContract;
