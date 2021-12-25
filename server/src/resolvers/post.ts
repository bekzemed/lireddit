import { Post } from '../entities/Post';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';

@InputType()
class PostInput {
  @Field()
  title!: string;
  @Field()
  text!: string;
}

@Resolver()
export class PostResolver {
  // getting all posts from type orm db
  @Query(() => [Post])
  posts(): Promise<Post[]> {
    return Post.find();
  }

  // getting post by id
  @Query(() => Post, { nullable: true })
  post(@Arg('_id') _id: number): Promise<Post | undefined> {
    return Post.findOne(_id);
  }

  // creating post
  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  // update post
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('_id') _id: number,
    @Arg('title', () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne(_id);
    if (!post) {
      return null;
    }

    if (typeof title !== 'undefined') {
      await Post.update({ _id }, { title });
    }
    return post;
  }

  // delete post
  @Mutation(() => Boolean)
  async deletePost(@Arg('_id') _id: number): Promise<boolean> {
    try {
      await Post.delete(_id);
    } catch {
      return false;
    }
    return true;
  }
}
