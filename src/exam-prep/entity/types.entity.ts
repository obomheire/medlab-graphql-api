import { Field, ObjectType } from "@nestjs/graphql";



@ObjectType()
export class LearningPathType {
    @Field(()=>String)
    step: string;

    @Field(()=>String)
    subject: string;

    @Field(()=>[TopicType])
    topics: TopicType[];

    @Field(()=>[QuestionsAreaType], {nullable: true})
    questionsAreas?: QuestionsAreaType[]
}

@ObjectType()
export class TopicType {
    @Field(()=>String)
    title: string;

    @Field(()=>[String], {nullable: true})
    subTopics?: string[]
}

@ObjectType()
export class QuestionsAreaType {
    @Field(()=> String)
    text: string;

    @Field(()=> String, {nullable: true})
    link?: string;

    @Field(()=> String, {nullable: true})
    image?: string
}