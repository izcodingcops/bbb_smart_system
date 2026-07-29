import {useMemo} from 'react';
import {useMutation, useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  Fixture,
  FixtureCreator,
  FixtureDetail,
  FixtureFormOptions,
  FixtureFormValues,
  FixtureStatus,
} from '../../../types/fixture';
import {
  CREATE_FIXTURE,
  DELETE_FIXTURE,
  GET_FIXTURE,
  GET_FIXTURE_FORM_OPTIONS,
  GET_FIXTURES,
  SET_FIXTURE_STATUS,
  UPDATE_FIXTURE,
} from './documents';

interface GqlFixture {
  id: string;
  reference: string;
  title: string;
  fixtureType: string;
  zone: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: FixtureCreator;
  queuedOffline: boolean;
  createdAt: string;
  address: string;
}

const STATUS: Record<GqlFixture['status'], FixtureStatus> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

const toFixture = (f: GqlFixture): Fixture => ({
  id: f.reference,
  title: f.title,
  fixtureType: f.fixtureType,
  zone: f.zone,
  status: STATUS[f.status],
  createdBy: f.createdBy,
  queuedOffline: f.queuedOffline,
  createdAt: f.createdAt,
  address: f.address,
});

/**
 * `filter` is wired into the document but sent as null: the screen filters,
 * sorts and searches client-side via src/screens/fixture/filtering.ts, same
 * convention as Maintenance.
 */
export function useGetFixturesQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{fixtures: GqlFixture[]}>(
    GET_FIXTURES,
    {
      context: {feature: 'fixture'},
      variables: {programId: programId ?? '', filter: null},
      skip: !programId,
    },
  );

  // Memoised so the returned array keeps a stable identity between renders —
  // FixtureScreen feeds this into a useMemo dependency array.
  const fixtures = useMemo(
    () => (data?.fixtures ?? []).map(toFixture),
    [data],
  );

  return {data: fixtures, isLoading: loading, isError: !!error, refetch};
}

const STATUS_OUT: Record<FixtureStatus, string> = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
};

interface GqlFixtureDetail extends GqlFixture {
  describeLocation: string | null;
  latitude: string | null;
  longitude: string | null;
  description: string | null;
  documents: string[];
}

const toDetail = (d: GqlFixtureDetail): FixtureDetail => ({
  ...toFixture(d),
  describeLocation: d.describeLocation,
  latitude: d.latitude,
  longitude: d.longitude,
  description: d.description,
  documents: d.documents,
});

const toWireInput = (values: FixtureFormValues) => ({
  title: values.title,
  serviceDateTime: values.serviceDateTime,
  fixtureType: values.fixtureType,
  status: STATUS_OUT[values.status],
  address: values.address,
  zone: values.zone,
  describeLocation: values.describeLocation || null,
  description: values.description || null,
  documents: values.documents,
});

const FIXTURE_CONTEXT = {context: {feature: 'fixture'}};

/** The mock store mutates in place, so refetch rather than patch the cache. */
const REFRESH_LIST = {...FIXTURE_CONTEXT, refetchQueries: ['GetFixtures']};
const REFRESH_DETAIL = {
  ...FIXTURE_CONTEXT,
  refetchQueries: ['GetFixtures', 'GetFixture'],
};

export function useGetFixtureQuery(id: string) {
  const {data, loading, error, refetch} = useQuery<{
    fixture: GqlFixtureDetail | null;
  }>(GET_FIXTURE, {...FIXTURE_CONTEXT, variables: {id}});

  const detail = useMemo(
    () => (data?.fixture ? toDetail(data.fixture) : null),
    [data],
  );

  return {data: detail, isLoading: loading, isError: !!error, refetch};
}

export function useFixtureFormOptionsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    fixtureFormOptions: FixtureFormOptions;
  }>(GET_FIXTURE_FORM_OPTIONS, {
    ...FIXTURE_CONTEXT,
    variables: {programId: programId ?? ''},
    skip: !programId,
    // nextReference has to be fresh on every open.
    fetchPolicy: 'network-only',
  });

  return {
    data: data?.fixtureFormOptions ?? null,
    isLoading: loading,
    isError: !!error,
    refetch,
  };
}

// Status changes come from the list, where the detail query isn't mounted —
// naming it here would make Apollo warn about refetching an inactive query.
export function useSetFixtureStatusMutation() {
  const [run, {loading}] = useMutation(SET_FIXTURE_STATUS, REFRESH_LIST);
  return {
    mutate: async (id: string, status: FixtureStatus) => {
      await run({variables: {id, status: STATUS_OUT[status]}});
    },
    isLoading: loading,
  };
}

export function useCreateFixtureMutation() {
  const programId = GetActiveProgramId();
  const [run, {loading}] = useMutation<{createFixture: {reference: string}}>(
    CREATE_FIXTURE,
    REFRESH_LIST,
  );
  return {
    mutate: async (values: FixtureFormValues) => {
      const result = await run({
        variables: {programId: programId ?? '', input: toWireInput(values)},
      });
      return result.data?.createFixture.reference ?? '';
    },
    isLoading: loading,
  };
}

export function useUpdateFixtureMutation() {
  const [run, {loading}] = useMutation(UPDATE_FIXTURE, REFRESH_DETAIL);
  return {
    mutate: async (id: string, values: FixtureFormValues) => {
      await run({variables: {id, input: toWireInput(values)}});
    },
    isLoading: loading,
  };
}

export function useDeleteFixtureMutation() {
  const [run, {loading}] = useMutation(DELETE_FIXTURE, REFRESH_LIST);
  return {
    mutate: async (id: string) => {
      await run({variables: {id}});
    },
    isLoading: loading,
  };
}
