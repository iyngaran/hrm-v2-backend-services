import Long from 'long';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Timestamp } from '../../../../../generated/typescript/google/protobuf/timestamp';
import { User as UserProto } from '../../../../../generated/typescript/user-service/users/types';
import { Role } from './role.entity';

@Entity({ name: 'users' })
export class User implements Omit<UserProto, 'roles' | 'timestamps'> {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'first_name', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', length: 100 })
  lastName!: string;

  @Column({ unique: true, length: 250 })
  email!: string;

  @Column({ name: 'primary_phone_number', length: 20 })
  primaryPhoneNumber!: string;

  @Column('text', {
    name: 'phone_numbers',
    array: true,
    default: () => 'ARRAY[]::text[]',
  })
  phoneNumbers!: string[];

  @Column({ length: 255, select: false }) // Don't select password by default
  password!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified!: boolean;

  @Column({ name: 'is_mfa_enabled', default: false })
  isMfaEnabled!: boolean;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: Role[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp with time zone' })
  deletedAt?: Date;

  /**
   * Convert TypeORM entity to protobuf format
   */
  toProto(): UserProto {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      primaryPhoneNumber: this.primaryPhoneNumber,
      phoneNumbers: this.phoneNumbers,
      password: this.password,
      isActive: this.isActive,
      isEmailVerified: this.isEmailVerified,
      isMfaEnabled: this.isMfaEnabled,
      roles: [], // Will be populated when Role relationship is implemented
      timestamps: {
        createdAt: this.dateToTimestamp(this.createdAt),
        updatedAt: this.dateToTimestamp(this.updatedAt),
        deletedAt: this.deletedAt
          ? this.dateToTimestamp(this.deletedAt)
          : undefined,
      },
    };
  }

  /**
   * Helper method to convert Date to Timestamp
   */
  private dateToTimestamp(date: Date): Timestamp {
    const milliseconds = date.getTime();
    const seconds = Math.floor(milliseconds / 1000);
    return {
      seconds: Long.fromNumber(seconds),
      nanos: (milliseconds % 1000) * 1000000,
    };
  }

  /**
   * Create entity from protobuf format
   */
  static fromProto(proto: Partial<UserProto>): User {
    const user = new User();
    user.id = proto.id || '';
    user.firstName = proto.firstName || '';
    user.lastName = proto.lastName || '';
    user.email = proto.email || '';
    user.primaryPhoneNumber = proto.primaryPhoneNumber || '';
    user.phoneNumbers = proto.phoneNumbers || [];
    user.password = proto.password || '';
    user.isActive = proto.isActive ?? true;
    user.isEmailVerified = proto.isEmailVerified ?? false;
    user.isMfaEnabled = proto.isMfaEnabled ?? false;
    return user;
  }
}
