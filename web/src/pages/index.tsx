import { DeleteIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import { withUrqlClient } from 'next-urql';
import NextLink from 'next/link';
import { useState } from 'react';
import { Layout } from '../components/Layout';
import { UpdootPost } from '../components/UpdootPost';
import { useDeletePostMutation, usePostsQuery } from '../generated/graphql';
import createUrqlClient from '../utils/createUrqlClient';

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: null as string | null,
  });
  const [{ data, fetching }] = usePostsQuery({ variables });
  const [, deletePost] = useDeletePostMutation();

  if (!data && !fetching) {
    return <div>you got query failed for some reason</div>;
  }
  return (
    <Layout>
      {!data && fetching ? (
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
                <IconButton
                  aria-label="Delete Post"
                  icon={<DeleteIcon />}
                  colorScheme={'red'}
                  onClick={() => {
                    deletePost({ _id: p._id });
                  }}
                />
              </Flex>
            )
          )}
        </Stack>
      )}
      {data && data.posts.hasMore && (
        <Flex>
          <Button
            onClick={() =>
              setVariables({
                limit: variables.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              })
            }
            isLoading={fetching}
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
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
