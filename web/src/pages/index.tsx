import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { EditDeletePostButtons } from '../components/EditDeletePostButtons';
import { Layout } from '../components/Layout';
import { UpdootPost } from '../components/UpdootPost';
import { usePostsQuery } from '../generated/graphql';
import { withApollo } from '../utils/withApollo';

const Index = () => {
  const { data, loading, fetchMore, variables } = usePostsQuery({
    variables: {
      limit: 10,
      cursor: null,
    },
    notifyOnNetworkStatusChange: true,
  });

  if (!data && !loading) {
    return <div>you got query failed for some reason</div>;
  }
  return (
    <Layout>
      {!data && loading ? (
        <div>loading ...</div>
      ) : (
        <Stack spacing={8} mb={4}>
          {/* after invalidating the post, it will be null so we have to conditionally render it */}
          {data!.posts.posts.map(p =>
            !p ? null : (
              <Flex key={p._id} p={5} shadow="md" borderWidth="1px">
                <UpdootPost post={p} />

                <Box mr={'auto'}>
                  <NextLink href="/post/[id]" as={`/post/${p._id}`}>
                    <Link>
                      <Heading fontSize="xl">{p.title}</Heading>
                    </Link>
                  </NextLink>
                  <Text>posted by {p.creator.username}</Text>
                  <Text mt={4}>{p.textSnippet}</Text>
                </Box>
                <EditDeletePostButtons id={p._id} creatorId={p.creator._id} />
              </Flex>
            )
          )}
        </Stack>
      )}
      {data && data.posts.hasMore && (
        <Flex>
          <Button
            onClick={() => {
              fetchMore({
                variables: {
                  limit: variables?.limit,
                  cursor:
                    data.posts.posts[data.posts.posts.length - 1].createdAt,
                },
                // updateQuery: (
                //   previousResult,
                //   { fetchMoreResult }
                // ): PostsQuery => {
                //   if (!fetchMoreResult) {
                //     return previousResult;
                //   }
                //   return {
                //     __typename: 'Query',
                //     posts: {
                //       __typename: 'PaginatedPosts',
                //       hasMore: fetchMoreResult.posts.hasMore,
                //       posts: [
                //         ...previousResult.posts.posts,
                //         ...fetchMoreResult.posts.posts,
                //       ],
                //     },
                //   };
                // },
              });
            }}
            isLoading={loading}
            mx={'auto'}
            my={8}
            bg={'tan'}
          >
            load more
          </Button>
        </Flex>
      )}
    </Layout>
  );
};
export default withApollo({ ssr: true })(Index);
