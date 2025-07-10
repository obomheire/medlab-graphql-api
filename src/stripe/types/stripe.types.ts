import { ObjectType, Field } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
export class PaymentRes {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  client_secret: string;

  @Field(() => String, { nullable: true })
  status: string;
}

@ObjectType()
export class SetupIntRes extends PaymentRes {}

@ObjectType()
export class DataRes {
  @Field(() => GraphQLJSON) // Return response as json object
  data: { [key: string]: any };
}

@ObjectType()
export class RetrieveSetupIntRes {
  @Field(() => GraphQLJSON)
  setupIntent: { [key: string]: any };
}

@ObjectType()
export class PaymentMethodRes {
  @Field(() => GraphQLJSON)
  paymentMethod: { [key: string]: any };
}

@ObjectType()
export class PaymentIntRes {
  @Field(() => GraphQLJSON)
  paymentIntent: { [key: string]: any };
}
