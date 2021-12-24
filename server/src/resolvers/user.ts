import { User } from '../entities/User';
import { MyContext } from '../types';
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import argon2 from 'argon2';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constants';
import { UsernameAndPasswordInputs } from './UsernameAndPasswordInputs';
import { validateRegister } from '../utils/validateRegister';
import { sendEmail } from '../utils/sendEmail';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  // change password
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { em, redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 3) {
      return {
        errors: [
          {
            field: 'newPassword',
            message: 'length of password should be greater than 3',
          },
        ],
      };
    }

    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);

    if (!userId) {
      return {
        errors: [
          {
            field: 'token',
            message: 'token expired',
          },
        ],
      };
    }

    const user = await em.findOne(User, { _id: parseInt(userId) });

    if (!user) {
      return {
        errors: [
          {
            field: 'user',
            message: 'user no longer exists',
          },
        ],
      };
    }

    user.password = await argon2.hash(newPassword);
    await em.persistAndFlush(user);

    // delete token after its being used
    await redis.del(key);

    // login user after change password
    req.session.userId = user._id;

    return { user };
  }

  // forget password
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { em, redis }: MyContext
  ) {
    let user = await em.findOne(User, { email });
    if (!user) {
      return true;
    }

    const token = uuidv4();
    redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user._id,
      'ex',
      1000 * 60 * 60 * 24 * 3
    ); // 3 days

    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}"> reset password </a>`
    );
    return true;
  }
  // to see all users
  @Query(() => [User], { nullable: true })
  async listUsers(@Ctx() { em }: MyContext) {
    const users = await em.find(User, {});
    return users;
  }

  // to check login user
  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }
    const user = await em.findOne(User, { _id: req.session.userId });
    return user;
  }

  // register the user
  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernameAndPasswordInputs,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);

    if (errors) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      email: options.email,
      password: hashedPassword,
    });

    try {
      await em.persistAndFlush(user);
    } catch (err) {
      // duplicate username error
      if (err.code === '23505') {
        return {
          errors: [
            {
              field: 'username',
              message: 'duplicate username',
            },
          ],
        };
      }
    }

    // store user id session
    // set the cookie on the user
    // keep them logged in

    req.session.userId = user._id;

    return { user };
  }

  // login the user
  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(
      User,
      usernameOrEmail.includes('@')
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );

    if (!user) {
      return {
        errors: [
          {
            field: 'usernameOrEmail',
            message: 'username doesnt exist',
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, password);

    if (!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'mismatch password',
          },
        ],
      };
    }

    req.session.userId = user._id;

    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    // remove session from redis
    return new Promise(resolve =>
      req.session.destroy(err => {
        // remove cookie from browser
        res.clearCookie(COOKIE_NAME);
        if (err) {
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }
}
