import {useMemo} from 'react';
import {useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {ReferenceDocument, ReferenceDocumentFilterOptions} from '../../../types/referenceDocument';
import {
  GET_REFERENCE_DOCUMENT,
  GET_REFERENCE_DOCUMENT_FILTER_OPTIONS,
  GET_REFERENCE_DOCUMENTS,
} from './documents';

const REFERENCE_DOCUMENT_CONTEXT = {context: {feature: 'referenceDocument'}};

export function useGetReferenceDocumentsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{referenceDocuments: ReferenceDocument[]}>(
    GET_REFERENCE_DOCUMENTS,
    {
      ...REFERENCE_DOCUMENT_CONTEXT,
      variables: {programId: programId ?? ''},
      skip: !programId,
    },
  );

  const documents = useMemo(() => data?.referenceDocuments ?? [], [data]);

  return {data: documents, isLoading: loading, isError: !!error, refetch};
}

export function useReferenceDocumentFilterOptionsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    referenceDocumentFilterOptions: ReferenceDocumentFilterOptions;
  }>(GET_REFERENCE_DOCUMENT_FILTER_OPTIONS, {
    ...REFERENCE_DOCUMENT_CONTEXT,
    variables: {programId: programId ?? ''},
    skip: !programId,
    // No create form reads this module, so there's no "must be fresh for a
    // reserved reference" concern the way every other module's FormOptions
    // query has — cache-first is safe and is this hook's only caller anyway.
    fetchPolicy: 'cache-first',
  });

  return {
    data: data?.referenceDocumentFilterOptions ?? null,
    isLoading: loading,
    isError: !!error,
    refetch,
  };
}

export function useGetReferenceDocumentQuery(id: string) {
  const {data, loading, error, refetch} = useQuery<{referenceDocument: ReferenceDocument | null}>(
    GET_REFERENCE_DOCUMENT,
    {...REFERENCE_DOCUMENT_CONTEXT, variables: {id}},
  );

  return {data: data?.referenceDocument ?? null, isLoading: loading, isError: !!error, refetch};
}
