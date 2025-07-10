import { Field, InputType } from "@nestjs/graphql";
import { TemplateCaseType } from "../enum/clinicalExam.enum";

@InputType()
export class CreateTemplateCategoryInput {
    @Field(() => String)
    name: string;
  
    @Field(() => String, { nullable: true })
    description: string;
  
    @Field(() => String, { nullable: true })
    image: string;
  
    @Field(() => String, { nullable: true })
    icon: string;
}

@InputType()
export class AddTemplateCaseInput {
    @Field(() => String)
    category: string;

    @Field(() => String)
    templateName: string;

}

@InputType()
export class AddShortCaseTemplateInput {
    @Field(() => String)
    category: string;

    @Field(() => String)
    templateName: string;

    @Field(()=> String)
    title: string

}

