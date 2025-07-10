import { Field, ObjectType } from "@nestjs/graphql"


@ObjectType()
export class OptionType{
    @Field(()=>String, {nullable: true})
    title: string

    @Field(()=>String, {nullable: true})
    route: string

    @Field(()=>String, {nullable: true})
    key: string

    @Field(()=>[String], {nullable: true})
    subspecialties: string[]
}

@ObjectType()
export class OptionOnPositionType{
    @Field(()=>String, {nullable: true})
    title: string

    @Field(()=>String, {nullable: true})
    route: string

    @Field(()=>String, {nullable: true})
    key: string

    @Field(()=>[OptionType], {nullable: true})
    subspecialties: OptionType[]
}

@ObjectType()
export class AskQuestionRes{
    @Field(()=>String)
    question: string

    @Field(()=>Number)
    progress: number

    @Field(()=>[OptionType], {nullable: true})
    options: OptionType[]

    @Field(()=> String)
    userResponse: string
}


