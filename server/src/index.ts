import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import mikroConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';

const main = async () => {
  // database connection
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up();

  // initialize the app
  const app = express();

  // connect redis
  const RedisStore = connectRedis(session);
  const redisClient = new Redis();
  app.use(
    session({
      name: 'qid',
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
        disableTTL: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        sameSite: 'lax', // csrf
        httpOnly: true, // cookie cant be accessed by frontend
        secure: __prod__, // works only https and in production
      },
      saveUninitialized: false,
      secret: 'afsfjskjkdjfkajsdfkjsd',
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),

    // resolver can get this context value which is datase value
    context: ({ req, res }) => ({ em: orm.em, req, res }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({
    app,
    cors: {
      origin: 'http://localhost:3000',
      credentials: true,
    },
  });

  app.listen(4000, () => {
    console.log('server is started at port 4000');
  });
};

main().catch(err => {
  console.error(err);
});
