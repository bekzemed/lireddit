import { ApolloCache, gql } from '@apollo/client';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';
import React, { useState } from 'react';
import {
  PostSnippetFragment,
  useVoteMutation,
  VoteMutation,
} from '../generated/graphql';

interface UpdootPostProps {
  post: PostSnippetFragment;
}

const updateAfterCache = (
  value: number,
  postId: number,
  cache: ApolloCache<VoteMutation>
) => {
  const data = cache.readFragment<{
    _id: number;
    points: number;
    voteStatus: number | null;
  }>({
    id: 'Post:' + postId,
    fragment: gql`
      fragment _ on Post {
        _id
        points
        voteStatus
      }
    `,
  });

  if (data) {
    if (data.voteStatus === value) {
      return;
    }
    const newPoints = data.points + (!data.voteStatus ? 1 : 2) * value;

    cache.writeFragment({
      id: 'Post:' + postId,
      fragment: gql`
        fragment _ on Post {
          points
          voteStatus
        }
      `,
      data: { points: newPoints, voteStatus: value },
    });
  }
};

export const UpdootPost: React.FC<UpdootPostProps> = ({ post }) => {
  const [updootLoading, setUpdootLoading] = useState<
    'not-loading' | 'updoot-loading' | 'downdoot-loading'
  >('not-loading');
  const [vote] = useVoteMutation();

  return (
    <Flex cursor={'pointer'} mr={4} direction={'column'}>
      <IconButton
        onClick={async () => {
          if (post.voteStatus === 1) {
            return;
          }
          setUpdootLoading('updoot-loading');
          await vote({
            variables: { value: 1, postId: post._id },
            update: cache => updateAfterCache(1, post._id, cache),
          });
          setUpdootLoading('not-loading');
        }}
        colorScheme={post.voteStatus === 1 ? 'green' : undefined}
        isLoading={updootLoading === 'updoot-loading'}
        aria-label="updoot post"
        icon={<ChevronUpIcon w={6} h={6} />}
      />
      <Flex justify={'center'}>{post.points}</Flex>
      <IconButton
        onClick={async () => {
          if (post.voteStatus === -1) {
            return;
          }
          setUpdootLoading('downdoot-loading');
          await vote({
            variables: { value: -1, postId: post._id },
            update: cache => updateAfterCache(-1, post._id, cache),
          });
          setUpdootLoading('not-loading');
        }}
        colorScheme={post.voteStatus === -1 ? 'red' : undefined}
        isLoading={updootLoading === 'downdoot-loading'}
        aria-label="downdoot post"
        icon={<ChevronDownIcon w={6} h={6} />}
      />
    </Flex>
  );
};
