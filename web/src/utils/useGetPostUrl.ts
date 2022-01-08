import { usePostQuery } from '../generated/graphql';
import { useGetIntId } from './useGetIntId';

export const useGetPostUrl = () => {
  const intId = useGetIntId();
  return usePostQuery({
    skip: intId === -1,
    variables: { _id: intId },
  });
};
