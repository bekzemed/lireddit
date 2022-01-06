import 'reflect-metadata';
import 'dotenv-safe/config';
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
import path from 'path';
import { Updoot } from './entities/Updoot';
import { createUserLoader } from './utils/createUserLoader';
import { createUpdootLoader } from './utils/createUpdootLoader';

//
const main = async () => {
  // typeorm database connection
  const conn = await createConnection({
    type: 'postgres',
    // database: 'lireddit2',
    // username: 'postgres',
    // password: 'bek',
    url: process.env.DATABASE_URL,
    entities: [Post, User, Updoot],
    migrations: [path.join(__dirname, './migrations/*')],
    synchronize: true,
    logging: true,
  });
  await conn.runMigrations();

  // to delete post in the database
  // await Post.delete({});

  // initialize the app
  const app = express();

  // connect redis
  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);
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
      secret: process.env.SESSION_SECRET,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),

    // resolver can get this context value which is database value
    // runs at every request
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      updootLoader: createUpdootLoader(),
    }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({
    app,
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    },
  });

  app.listen(parseInt(process.env.PORT), () => {
    console.log(`server is started at port ${process.env.PORT}`);
  });
};

main().catch(err => {
  console.error(err);
});
