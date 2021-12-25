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
import { Layout } from '../components/Layout';
import { usePostsQuery } from '../generated/graphql';
import createUrqlClient from '../utils/createUrqlClient';
import NextLink from 'next/link';

const Index = () => {
  const [{ data, fetching }] = usePostsQuery({
    variables: {
      limit: 10,
      // cursor: data?.posts[0]
    },
  });

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
        <Stack spacing={8}>
          {data!.posts.map(p => (
            <Box key={p._id} p={5} shadow="md" borderWidth="1px">
              <Heading fontSize="xl">{p.title}</Heading>
              <Text mt={4}>{p.textSnippet}</Text>
            </Box>
          ))}
        </Stack>
      )}
      {data && (
        <Flex>
          <Button isLoading={fetching} mx={'auto'} my={8} bg={'tan'}>
            load more
          </Button>
        </Flex>
      )}
    </Layout>
  );
};
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
