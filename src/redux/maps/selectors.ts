import {useSelector} from 'react-redux';
import {DownloadedMap} from '../../types/maps';
import {RootState} from '../store';

export const GetDownloadedMaps = (): DownloadedMap[] =>
  useSelector((state: RootState) => state.maps.items);

export const GetDownloadedMapById = (id: string | null): DownloadedMap | null =>
  useSelector((state: RootState) =>
    id ? state.maps.items.find(item => item.id === id) ?? null : null,
  );

export const GetDownloadedMapCount = (): number =>
  useSelector((state: RootState) => state.maps.items.length);
