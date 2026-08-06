import {useSelector} from 'react-redux';
import {DownloadedMap} from '../../types/maps';
import {RootState} from '../store';

export const GetDownloadedMaps = (): DownloadedMap[] =>
  useSelector((state: RootState) => state.maps.items);
