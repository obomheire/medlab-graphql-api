
import { Field, InputType } from "@nestjs/graphql"

@InputType()
export class AskQuestionInput{
    @Field(()=>String, {nullable: true})
    question: string

    @Field(()=>Number, {nullable: true, defaultValue: 0})
    progress: number

    @Field(()=>[OptionInput], {nullable: true})
    options: OptionInput[]

    @Field(()=> String, {nullable: true})
    userResponse: string
}

@InputType()
export class OptionInput{
    @Field(()=>String, {nullable: true})
    title: string

    @Field(()=>String, {nullable: true})
    route: string

    @Field(()=>String, {nullable: true})
    key: string
}