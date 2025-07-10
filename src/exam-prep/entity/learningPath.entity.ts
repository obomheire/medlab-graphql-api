import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { mongooseSchemaConfig } from 'src/utilities/config/schema.config';
import { v4 as uuidv4 } from 'uuid';
import { Document } from 'mongoose';
import { LearningPathType } from './types.entity';

@ObjectType()
@Schema(mongooseSchemaConfig)
export class LearningPathEntity {
  @Field(() => String)
  @Prop({ type: String, default: uuidv4 })
  learningPathUUID: string;

  @Field(() => String)
  @Prop()
  userUUID: string;

  @Field(() => String, { nullable: true })
  @Prop()
  threadId?: string;

  @Field(() => String)
  @Prop()
  title: string;

  @Field(() => String)
  @Prop()
  learningPathContent: string;
}

export const LearningPathSchema =
  SchemaFactory.createForClass(LearningPathEntity);
export type LearningPathDocument = LearningPathEntity & Document;

// import { Field, ObjectType } from "@nestjs/graphql";
// import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
// import { mongooseSchemaConfig } from "src/utils/database/schema.config";
// import { v4 as uuidv4 } from 'uuid';
// import { Document } from "mongoose";
// import { LearningPathType } from "./types.entity";

// @ObjectType()
// @Schema(mongooseSchemaConfig)
// export class LearningPathEntity {
//     @Field(()=>String)
//     @Prop({type: String, default: uuidv4})
//     learningPathUUID: string

//     @Field(()=>String)
//     @Prop()
//     userUUID: string;

//     @Field(()=>String, {nullable: true})
//     @Prop()
//     threadId?: string;

//     @Field(()=>String, {nullable: true})
//     @Prop()
//     messageId?: string;

//     @Field(()=> String)
//     @Prop()
//     title: string;

//     @Field(()=>String)
//     @Prop()
//     duration: string;

//     @Field(()=> [LearningPathType])
//     @Prop({type: [LearningPathType]})
//     learningPath: LearningPathType[]

//     @Field(()=>[String], {nullable: true})
//     @Prop({type: [String]})
//     assessingProgress?: string[]
// }

// export const LearningPathSchema = SchemaFactory.createForClass(LearningPathEntity)
// export type LearningPathDocument = LearningPathEntity & Document
