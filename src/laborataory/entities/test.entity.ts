import { Field, Int, ObjectType } from '@nestjs/graphql';
import { InvestigationEntity } from '../../patient/entities/investigation.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Test {
  @Field(() => String, { description: 'id field (placeholder)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  @Field(() => String, { description: 'name field (placeholder)' })
  name: string;

  @Column({ nullable: true })
  @Field(() => String, {
    description: 'description field (placeholder)',
    nullable: true,
  })
  description: string;

  @Column({ nullable: false })
  @Field(() => String, {
    description: 'testcode field (placeholder)',
    nullable: false,
  })
  testCode: string;

  @Column({ nullable: true })
  @Field(() => String, {
    description: 'duration field (placeholder)',
    nullable: true,
  })
  duration: string;

  @Column({ nullable: true })
  @Field(() => Int, { description: 'rate field (placeholder)', nullable: true })
  rate: number;

  @Column({ nullable: true })
  @Field(() => String, {
    description: 'test type field (placeholder)',
    nullable: true,
  })
  testType: string;

  @OneToMany(() => InvestigationEntity, (investigations) => investigations.test)
  @Field(() => [InvestigationEntity], {
    description: 'investigations field (placeholder)',
    nullable: true,
  })
  investigations?: InvestigationEntity[] | null;
}
