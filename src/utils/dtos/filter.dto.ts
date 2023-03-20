import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsIn, IsNotEmpty, IsDate, IsNumber, IsString } from 'class-validator';

@InputType()
export class FilterDto {
    @Field({ nullable: true })
    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sort: 'ASC' | 'DESC';
    
    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    search: string = '';

    @Field({ nullable: true })
    @IsOptional()
    @IsNumber()
    page: number = 1;

    @Field({ nullable: true })
    @IsOptional()
    @IsNumber()
    limit: number = 10;

    @Field({ nullable: true })
    @IsOptional()
    @IsDate()
    startDate: Date

    @Field({ nullable: true })
    @IsOptional()
    @IsDate()
    endDate: Date
}
