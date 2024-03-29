import { useApolloClient } from '@apollo/client';
import { Box, Button, Flex, Heading, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import React from 'react';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { isServer } from '../utils/isServer';

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [logout, { loading: isLogoutFetching }] = useLogoutMutation();
  const { data, loading } = useMeQuery({ skip: isServer() });
  const apolloClient = useApolloClient();

  let body = null;

  if (loading) {
    body = null;
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href="/login">
          <Link mr={2}>login</Link>
        </NextLink>
        <NextLink href="/register">
          <Link>register</Link>
        </NextLink>
      </>
    );
  } else {
    body = (
      <Flex alignItems={'center'}>
        <NextLink href={'/create-post'}>
          <Button
            as={Link}
            mr={2}
            bgColor={'white'}
            _hover={{ bgColor: 'white' }}
          >
            create post
          </Button>
        </NextLink>
        <Box mr={2}>{data.me.username}</Box>
        <Button
          variant={'link'}
          onClick={async () => {
            await logout();
            await apolloClient.resetStore();
          }}
          isLoading={isLogoutFetching}
          color={'blue.600'}
        >
          logout
        </Button>
      </Flex>
    );
  }

  return (
    <Flex position={'sticky'} top={0} zIndex={1} bgColor="tan" p={4}>
      <Flex maxW={800} flex={1} m={'auto'} align={'center'}>
        <NextLink href={'/'}>
          <Link>
            <Heading>LiReddit</Heading>
          </Link>
        </NextLink>

        <Box ml="auto">{body}</Box>
      </Flex>
    </Flex>
  );
};
