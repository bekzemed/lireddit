import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';
import React, { useState } from 'react';
import { PostSnippetFragment, useVoteMutation } from '../generated/graphql';

interface UpdootPostProps {
  post: PostSnippetFragment;
}

export const UpdootPost: React.FC<UpdootPostProps> = ({ post }) => {
  const [updootLoading, setUpdootLoading] = useState<
    'not-loading' | 'updoot-loading' | 'downdoot-loading'
  >('not-loading');
  const [, vote] = useVoteMutation();

  return (
    <Flex cursor={'pointer'} mr={4} direction={'column'}>
      <IconButton
        onClick={async () => {
          setUpdootLoading('updoot-loading');
          await vote({ value: 1, postId: post._id });
          setUpdootLoading('not-loading');
        }}
        isLoading={updootLoading === 'updoot-loading'}
        aria-label="updoot post"
        icon={<ChevronUpIcon w={6} h={6} />}
      />
      <Flex justify={'center'}>{post.points}</Flex>
      <IconButton
        onClick={async () => {
          setUpdootLoading('downdoot-loading');
          await vote({ value: -1, postId: post._id });
          setUpdootLoading('not-loading');
        }}
        isLoading={updootLoading === 'downdoot-loading'}
        aria-label="downdoot post"
        icon={<ChevronDownIcon w={6} h={6} />}
      />
    </Flex>
  );
};
