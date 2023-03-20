import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { User } from '../../user/entities/user.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Designation } from './designation.entity';

@Entity()
@ObjectType()
export class Role {
  @Field(() => String, { description: 'id field (placeholder)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String, { description: 'name field (placeholder)' })
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  name: string;

  @Field(() => String, { description: 'description field (placeholder)', nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @OneToMany(() => Designation, (designation) => designation.role, { nullable: true })
  @Field(() => [Designation], { description: 'designation field (placeholder)', nullable: true })
  designations: Designation[];

  @UpdateDateColumn()
  @Field(() => Date, { description: 'updated field (placeholder)' })
  updatedAt: Date;

  @CreateDateColumn()
  @Field(() => Date, { description: 'created field (placeholder)' })
  createdAt: Date;

  @OneToMany(() => User, (user) => user.role, { nullable: true })
  @Field(() => [User], { description: 'user field (placeholder)', nullable: true })
  users: User[];
}
