import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './Post';
import { User } from './User';

// m to n relationship
// user <-> posts
// user -> join table <- posts
// user -> updoot <- posts

// to change entity into graphql type we add object type and field to it
@Entity()
export class Updoot extends BaseEntity {
  @PrimaryGeneratedColumn()
  _id!: number;

  @Column()
  value: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, user => user.updoots)
  user: User;

  @Column()
  postId: number;

  @ManyToOne(() => Post, post => post.updoots)
  post: User;
}
