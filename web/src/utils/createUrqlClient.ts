import {
  dedupExchange,
  errorExchange,
  fetchExchange,
  stringifyVariables,
} from 'urql';
import {
  LoginMutation,
  MeQuery,
  MeDocument,
  RegisterMutation,
  LogoutMutation,
  VoteMutationVariables,
  DeletePostMutationVariables,
} from '../generated/graphql';
import { betterUpdateQuery } from './betterUpdateQuery';
import { cacheExchange, Resolver } from '@urql/exchange-graphcache';
import Router from 'next/router';
import { gql } from '@urql/core';
import { isServer } from './isServer';

// client side resolver
export const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;

    // console.log(entityKey, fieldName);

    const allFields = cache.inspectFields(entityKey);
    // console.log(allFields);

    const fieldInfos = allFields.filter(info => info.fieldName === fieldName);

    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    // console.log('field args: ', fieldArgs);
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    const isItInTheCache = cache.resolve(
      cache.resolve(entityKey, fieldKey) as string,
      'posts'
    );

    // we have to tell urql to fetch data from server if there is nothing in the server
    info.partial = !isItInTheCache; // !! cast to boolean
    // console.log('field we created: ', isItInTheCache);

    // reading the data from cache and returning it
    let results: string[] = [];
    let hasMore = true;
    fieldInfos.forEach(fi => {
      const key = cache.resolve(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(key, 'posts') as string[];
      const _hasMore = cache.resolve(key, 'hasMore') as boolean;

      if (!_hasMore) {
        hasMore = _hasMore;
      }
      if (results.length === 0) {
        results.push(...data);
      } else {
        results.splice(0, 11);
        results.push(...data);
      }
    });

    return {
      __typename: 'PaginatedPosts',
      hasMore,
      posts: results,
    };

    // const visited = new Set();
    // let result: NullArray<string> = [];
    // let prevOffset: number | null = null;

    // for (let i = 0; i < size; i++) {
    //   const { fieldKey, arguments: args } = fieldInfos[i];
    //   if (args === null || !compareArgs(fieldArgs, args)) {
    //     continue;
    //   }

    //   const links = cache.resolve(entityKey, fieldKey) as string[];
    //   const currentOffset = args[cursorArgument];

    //   if (
    //     links === null ||
    //     links.length === 0 ||
    //     typeof currentOffset !== 'number'
    //   ) {
    //     continue;
    //   }

    //   const tempResult: NullArray<string> = [];

    //   for (let j = 0; j < links.length; j++) {
    //     const link = links[j];
    //     if (visited.has(link)) continue;
    //     tempResult.push(link);
    //     visited.add(link);
    //   }

    //   if (
    //     (!prevOffset || currentOffset > prevOffset) ===
    //     (mergeMode === 'after')
    //   ) {
    //     result = [...result, ...tempResult];
    //   } else {
    //     result = [...tempResult, ...result];
    //   }

    //   prevOffset = currentOffset;
    // }

    // const hasCurrentPage = cache.resolve(entityKey, fieldName, fieldArgs);
    // if (hasCurrentPage) {
    //   return result;
    // } else if (!(info as any).store.schema) {
    //   return undefined;
    // } else {
    //   info.partial = true;
    //   return result;
    // }
  };
};

const createUrqlClient = (ssrExchange: any, ctx: any) => {
  let cookie = '';
  if (isServer()) {
    cookie = ctx?.req?.headers?.cookie;
  }

  return {
    url: 'http://localhost:4000/graphql',
    fetchOptions: {
      credentials: 'include' as const,
      headers: cookie ? { cookie } : undefined,
    },
    exchanges: [
      dedupExchange,
      cacheExchange({
        keys: {
          PaginatedPosts: () => null,
        },
        resolvers: {
          // pagination
          Query: {
            posts: cursorPagination(),
          },
        },
        updates: {
          Mutation: {
            // we dont have to invalidate cache for update post because it returs updated post and urql will update it
            deletePost: (_result, args, cache, info) => {
              // invalidating post will result null post
              cache.invalidate({
                __typename: 'Post',
                _id: (args as DeletePostMutationVariables)._id,
              });
            },
            vote: (_result, args, cache, info) => {
              const { postId, value } = args as VoteMutationVariables;

              const data = cache.readFragment(
                gql`
                  fragment _ on Post {
                    _id
                    points
                    voteStatus
                  }
                `,
                { _id: postId }
              );

              if (data) {
                if (data.voteStatus === value) {
                  return;
                }
                const newPoints =
                  data.points + (!data.voteStatus ? 1 : 2) * value;
                cache.writeFragment(
                  gql`
                    fragment _ on Post {
                      points
                      voteStatus
                    }
                  `,
                  { id: postId, points: newPoints, voteStatus: value }
                );
              }
            },
            createPost: (_result, args, cache, info) => {
              // invalidate(make the mutation run again from the beginning set we defined below) create post mutation
              // https://formidable.com/open-source/urql/docs/graphcache/cache-updates/#invalidating-entities
              // console.log(cache.inspectFields('Query'));

              // invalidate all paginated posts
              const allFields = cache.inspectFields('Query');
              const fieldInfos = allFields.filter(
                info => info.fieldName === 'posts'
              );

              fieldInfos.forEach(info => {
                cache.invalidate('Query', 'posts', info.arguments);
              });
            },
            login: (_result, args, cache, info) => {
              betterUpdateQuery<LoginMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.login.errors) {
                    return query;
                  } else {
                    return {
                      me: result.login.user,
                    };
                  }
                }
              );
            },
            register: (_result, args, cache, info) => {
              betterUpdateQuery<RegisterMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.register.errors) {
                    return query;
                  } else {
                    return {
                      me: result.register.user,
                    };
                  }
                }
              );
            },
            logout: (_result, args, cache, info) => {
              betterUpdateQuery<LogoutMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                () => ({ me: null })
              );
            },
          },
        },
      }),
      errorExchange({
        onError(error) {
          if (error?.message.includes('not authenticated')) {
            // redirect
            Router.replace('/login');
          }
        },
      }),
      ssrExchange,
      fetchExchange,
    ],
  };
};

export default createUrqlClient;
