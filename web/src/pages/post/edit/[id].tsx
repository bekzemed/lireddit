import { Box, Button } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import { InputField } from '../../../components/InputField';
import { Layout } from '../../../components/Layout';
import {
  usePostQuery,
  useUpdatePostMutation,
} from '../../../generated/graphql';
import { useGetIntId } from '../../../utils/useGetIntId';
import { withApollo } from '../../../utils/withApollo';

const EditPost = ({}) => {
  // since we update post and we return updated post we dont have to invalidate the cache
  const router = useRouter();
  const intId = useGetIntId();

  const { data, loading } = usePostQuery({
    skip: intId === -1,
    variables: { _id: intId },
  });

  const [updatePost] = useUpdatePostMutation();

  if (loading) {
    return <Box>loading ...</Box>;
  }

  if (!data?.post) {
    return (
      <Layout>
        <Box>Could not find post</Box>
      </Layout>
    );
  }

  return (
    <Layout variant="small">
      <Formik
        initialValues={{
          title: data.post.title,
          text: data.post.text,
        }}
        onSubmit={async values => {
          await updatePost({ variables: { _id: intId, ...values } });

          router.back();
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="title" placeholder="title" label="Title" />
            <Box my={4}>
              <InputField
                textarea
                name="text"
                placeholder="text..."
                label="Body"
              />
            </Box>

            <Button type="submit" colorScheme="teal" isLoading={isSubmitting}>
              Update post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withApollo({ ssr: false })(EditPost);
