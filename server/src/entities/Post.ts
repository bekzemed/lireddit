import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, ObjectType } from 'type-graphql';

// to change entity into graphql type we add object type and field to it
@ObjectType()
@Entity()
export class Post {
  @Field()
  @PrimaryKey()
  _id!: number;

  @Field()
  @Property({ type: 'date' })
  createdAt: Date = new Date();

  @Field()
  @Property({ type: 'date', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Field(() => String)
  @Property({ type: 'text' })
  title!: string;
}
