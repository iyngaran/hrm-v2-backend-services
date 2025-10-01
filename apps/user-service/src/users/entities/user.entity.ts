import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  firstName!: string;

  @Column({ length: 100, nullable: true })
  lastName?: string;

  @Column({ length: 250 })
  email!: string;

  @Column({ length: 15 })
  primaryPhoneNumber!: string;

  @Column('text', { nullable: true, array: true })
  phoneNumbers!: string[];

  @Column({ length: 120, nullable: true })
  password?: string;

  @CreateDateColumn()
  createdAt?: string;

  @UpdateDateColumn()
  updatedAt?: string;

  @DeleteDateColumn()
  deletedAt?: string;
}
