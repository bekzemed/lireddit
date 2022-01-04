import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { Flex, IconButton, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import React from 'react';
import { useDeletePostMutation, useMeQuery } from '../generated/graphql';

interface EditDeletePostButtonsProps {
  id: number;
  creatorId: number;
}

export const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({
  id,
  creatorId,
}) => {
  const [{ data: meData }] = useMeQuery();

  const [, deletePost] = useDeletePostMutation();

  if (meData?.me?._id !== creatorId) {
    return null;
  }
  return (
    <Flex direction={'column'} justifyContent={'space-between'}>
      <NextLink href={'/post/edit/[id]'} as={`/post/edit/${id}`}>
        <IconButton as={Link} aria-label="Update Post" icon={<EditIcon />} />
      </NextLink>

      <IconButton
        aria-label="Delete Post"
        icon={<DeleteIcon />}
        onClick={() => {
          deletePost({ _id: id });
        }}
      />
    </Flex>
  );
};
