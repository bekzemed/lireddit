import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import { withUrqlClient } from 'next-urql';
import NextLink from 'next/link';
import { useState } from 'react';
import { Layout } from '../components/Layout';
import { UpdootPost } from '../components/UpdootPost';
import { usePostsQuery } from '../generated/graphql';
import createUrqlClient from '../utils/createUrqlClient';

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: null as string | null,
  });
  const [{ data, fetching }] = usePostsQuery({ variables });

  if (!data && !fetching) {
    return <div>you got query failed for some reason</div>;
  }
  return (
    <Layout>
      <Flex align={'center'} mb={4}>
        <Heading>LiReddit</Heading>
        <NextLink href={'/create-post'}>
          <Link ml={'auto'}>create post</Link>
        </NextLink>
      </Flex>
      {!data && fetching ? (
        <div>loading ...</div>
      ) : (
        <Stack spacing={8} mb={4}>
          {data!.posts.posts.map(p => (
            <Flex key={p._id} p={5} shadow="md" borderWidth="1px">
              <UpdootPost post={p} />
              <Box>
                <Heading fontSize="xl">{p.title}</Heading>
                <Text>posted by {p.creator.username}</Text>
                <Text mt={4}>{p.textSnippet}</Text>
              </Box>
            </Flex>
          ))}
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
