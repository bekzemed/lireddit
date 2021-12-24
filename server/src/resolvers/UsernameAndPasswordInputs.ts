import { Field, InputType } from 'type-graphql';

@InputType()
export class UsernameAndPasswordInputs {
  @Field()
  username: string;

  @Field()
  email: string;

  @Field()
  password: string;
}
