import { Box, Heading } from '@chakra-ui/react';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import { EditDeletePostButtons } from '../../components/EditDeletePostButtons';
import { Layout } from '../../components/Layout';
import createUrqlClient from '../../utils/createUrqlClient';
import { useGetPostUrl } from '../../utils/useGetPostUrl';

const Post = ({}) => {
  const [{ data, fetching, error }] = useGetPostUrl();
  const router = useRouter();
  const postId =
    typeof router.query.id === 'string' ? parseInt(router.query.id) : -1;

  if (fetching) {
    return <Box>loading ...</Box>;
  }

  if (error) {
    return <Box>{error.message}</Box>;
  }

  if (!data?.post) {
    return (
      <Layout>
        <Box>Could not find post</Box>
      </Layout>
    );
  }
  return (
    <Layout>
      <Heading>{data.post.title}</Heading>
      {data.post.text}
      <EditDeletePostButtons id={postId} creatorId={data.post.creator._id} />
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
