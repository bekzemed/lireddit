import { Post } from '../entities/Post';
import { Arg, Mutation, Query, Resolver } from 'type-graphql';

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
  createPost(@Arg('title') title: string): Promise<Post> {
    return Post.create({ title }).save();
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
