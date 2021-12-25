import React from 'react';
import { Box, Button, Flex, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { isServer } from '../utils/isServer';

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ data, fetching }] = useMeQuery({ pause: isServer() });
  const [{ fetching: isLogoutFetching }, logout] = useLogoutMutation();

  let body = null;

  if (fetching) {
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
        <Box mr={2}>{data.me.username}</Box>
        <Button
          variant={'link'}
          onClick={() => logout()}
          isLoading={isLogoutFetching}
        >
          logout
        </Button>
      </Flex>
    );
  }

  return (
    <Box position={'sticky'} top={0} zIndex={1}>
      <Flex bgColor="tan" p={4}>
        <Box ml="auto">{body}</Box>
      </Flex>
    </Box>
  );
};
