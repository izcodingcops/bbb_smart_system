import client from '../../index';
import {ApiEndpoints} from '../../apiEndpoints';
import {API_MOCKS} from '../../../config/apiMocks';
import {mockLocationService} from './mockLocationService';
import {LocationServiceContract, GeoDataBody} from './contract';

const liveLocationService = {
  addGeoData: (body: GeoDataBody): Promise<{status: number; data: any}> =>
    client.post(ApiEndpoints.addGeoData, body).then(r => r.data),
} satisfies LocationServiceContract;

export const locationService: LocationServiceContract = API_MOCKS.location
  ? mockLocationService
  : liveLocationService;
