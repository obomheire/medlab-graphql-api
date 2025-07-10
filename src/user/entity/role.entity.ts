import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class RoleEntity {
  @Prop({ type: String, default: uuidv4 })
  roleUUID: string;

  @Field(() => String)
  @Prop()
  roleName: string;
}

export const RoleSchema = SchemaFactory.createForClass(RoleEntity);

export type RoleDocument = RoleEntity & Document;
