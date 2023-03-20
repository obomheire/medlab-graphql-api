import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from './role.entity';

@Entity()
@ObjectType()
export class Designation {
  @Field(() => String, { description: 'id field (placeholder)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String, { description: 'name field (placeholder)' })
  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Field(() => String, { description: 'description field (placeholder)' })
  @Column({ type: 'varchar', length: 255, nullable: false })
  description: string;

  @ManyToOne(() => Role, (role) => role.designations)
  @Field(() => Role, { description: 'role field (placeholder)' })
  role: Role;

  @OneToMany(() => User, (user) => user.role, { nullable: true })
  @Field(() => [User], {
    description: 'user field (placeholder)',
    nullable: true,
  })
  users: User[];
}
