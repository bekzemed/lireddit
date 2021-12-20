import { User } from '../entities/User';
import { MyContext } from '../types';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import argon2 from 'argon2';

@InputType()
class UsernameAndPasswordInputs {
  @Field()
  username: string;

  @Field()
  password: string;
}

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
    if (options.username.length <= 2) {
      return {
        errors: [
          {
            field: 'username',
            message: 'length of username should be greater than 2',
          },
        ],
      };
    }

    if (options.password.length <= 3) {
      return {
        errors: [
          {
            field: 'password',
            message: 'length of password should be greater than 3',
          },
        ],
      };
    }
    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });
    console.log(user);

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
    @Arg('options') options: UsernameAndPasswordInputs,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });

    if (!user) {
      return {
        errors: [
          {
            field: 'username',
            message: 'username doesnt exist',
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, options.password);

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
}
