import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useMeQuery } from '../generated/graphql';

// custom hook that check whether user is logged in or not
export const useIsAuth = () => {
  const [{ data, fetching }] = useMeQuery();
  const router = useRouter();

  useEffect(() => {
    if (!fetching && !data?.me) {
      router.replace('/login?next=' + router.pathname);
    }
  }, [data, router, fetching]);
};
