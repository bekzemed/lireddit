import { Box, Heading } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { EditDeletePostButtons } from '../../components/EditDeletePostButtons';
import { Layout } from '../../components/Layout';
import { useGetPostUrl } from '../../utils/useGetPostUrl';
import { withApollo } from '../../utils/withApollo';

const Post = ({}) => {
  const { data, loading, error } = useGetPostUrl();
  const router = useRouter();
  const postId =
    typeof router.query.id === 'string' ? parseInt(router.query.id) : -1;

  if (loading) {
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

export default withApollo({ ssr: true })(Post);
