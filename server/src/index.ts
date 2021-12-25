import 'reflect-metadata';
import { COOKIE_NAME, __prod__ } from './constants';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { createConnection } from 'typeorm';
import { Post } from './entities/Post';
import { User } from './entities/User';

const main = async () => {
  // typeorm database connection
  await createConnection({
    type: 'postgres',
    database: 'lireddit2',
    username: 'postgres',
    password: 'bek',
    entities: [Post, User],
    synchronize: true,
    logging: true,
  });

  // initialize the app
  const app = express();

  // connect redis
  const RedisStore = connectRedis(session);
  const redis = new Redis();
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
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
    context: ({ req, res }) => ({ req, res, redis }),
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
