import {useMemo} from 'react';
import {useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {ReferenceDocument} from '../../../types/referenceDocument';
import {GET_REFERENCE_DOCUMENT, GET_REFERENCE_DOCUMENTS} from './documents';

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

export function useGetReferenceDocumentQuery(id: string) {
  const {data, loading, error, refetch} = useQuery<{referenceDocument: ReferenceDocument | null}>(
    GET_REFERENCE_DOCUMENT,
    {...REFERENCE_DOCUMENT_CONTEXT, variables: {id}},
  );

  return {data: data?.referenceDocument ?? null, isLoading: loading, isError: !!error, refetch};
}
