import { IsString, IsOptional } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AddressInput {
    @Field(() => String, { description: 'address line 1 field (placeholder)', nullable: true })
    @IsString()
    @IsOptional()
    address: string;

    @Field(() => String, { description: 'address line 2 field (placeholder)', nullable: true })
    @IsString()
    @IsOptional()
    telephone: string;

    @Field(() => String, { description: 'city field (placeholder)', nullable: true })
    @IsString()
    @IsOptional()
    city: string;

    @Field(() => String, { description: 'state field (placeholder)', nullable: true })
    @IsString()
    @IsOptional()
    state: string;

    @Field(() => String, { description: 'country field (placeholder)', nullable: true })
    @IsString()
    @IsOptional()
    country: string;

    @Field(() => String, { description: 'pincode field (placeholder)', nullable: true })
    @IsString()
    @IsOptional()
    zipCode: string;
}