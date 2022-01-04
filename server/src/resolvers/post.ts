import { Post } from '../entities/Post';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { getConnection } from 'typeorm';
import { Updoot } from '../entities/Updoot';
import { User } from '../entities/User';

@InputType()
class PostInput {
  @Field()
  title!: string;
  @Field()
  text!: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  // this function called every time post object called and on the frontend graphql file
  // instead of calling text field we call this function
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  // USING DATA LOADER TO CACHE AND BATCH

  // this resolver excutes for every posts in the homepage
  // so to optimize this we used dataloader library
  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() { updootLoader, req }: MyContext
  ) {
    if (!req.session.userId) {
      return null;
    }
    const updoot = await updootLoader.load({
      postId: post._id,
      userId: req.session.userId,
    });

    return updoot ? updoot.value : null;
  }

  // vote
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const userId = req.session.userId;
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;

    const updoot = await Updoot.findOne({ where: { userId, postId } });

    // user is voted before
    // they are changing their vote

    if (updoot && updoot.value !== realValue) {
      await getConnection().transaction(async tm => {
        await tm.query(
          `
          update updoot
          set value = $1
          where "postId" = $2 and "userId" = $3
        `,
          [realValue, postId, userId]
        );

        await tm.query(
          `
          update post 
          set points = points + $1
          where _id = $2
          `,
          [2 * realValue, postId]
        );
      });
    } else if (!updoot) {
      // if the user has never vote the post before

      await getConnection().transaction(async tm => {
        await tm.query(
          `
        insert into updoot("userId", "postId", "value")
        values ($1, $2, $3)
        `,
          [userId, postId, realValue]
        );

        await tm.query(
          `
          update post 
          set points = points + $1
          where _id = $2
          `,
          [realValue, postId]
        );
      });
    }

    return true;
  }

  // getting all posts from type orm db
  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const replacements: any[] = [realLimitPlusOne];

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }

    // sub query
    const posts = await getConnection().query(
      `
    select p.*
    from post p
    ${cursor ? `where p."createdAt" < $2` : ''}
    order by p."createdAt" DESC
    limit $1
    `,
      replacements
    );

    // query builder
    // const qb = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder('p')
    //   .innerJoinAndSelect('p.creator', 'user', 'p."creatorId" = user._id')
    //   .orderBy('"createdAt"', 'DESC')
    //   .take(realLimitPlusOne);

    // if (cursor) {
    //   qb.where('"createdAt" < :cursor', {
    //     cursor: new Date(parseInt(cursor)),
    //   });
    // }

    // const posts = await qb.getMany();
    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  // getting post by id
  @Query(() => Post, { nullable: true })
  async post(@Arg('_id', () => Int) _id: number): Promise<Post | undefined> {
    // realtion join user and post table
    return Post.findOne(_id, { relations: ['creator'] });
    // return post[0];
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
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg('_id', () => Int) _id: number,
    @Arg('title') title: string,
    @Arg('text') text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('_id = :_id and "creatorId" = :creatorId', {
        _id,
        creatorId: req.session.userId,
      })
      .returning('*')
      .execute();

    // await Post.update({ _id, creatorId: req.session.userId }, { title, text });
    return result.raw[0];
  }

  // delete post
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg('_id', () => Int) _id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    // not cascade way

    // try {
    //   const post = await Post.findOne(_id);
    //   if (!post) {
    //     return false;
    //   }

    //   if (post.creatorId !== req.session.userId) {
    //     throw new Error('not authorized');
    //   }
    //   // before deleting the post we have to delete post id found in Updoot table
    //   // user can delete their own post only
    //   await Updoot.delete({ postId: _id });
    //   await Post.delete({ _id });
    // } catch {
    //   return false;
    // }

    // cascade --> deleting corosponding updoot while deleting some posts
    await Post.delete({ _id, creatorId: req.session.userId });
    return true;
  }
}
