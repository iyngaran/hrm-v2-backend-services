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
import { Role as RoleProto } from '../../../../../generated/typescript/user-service/users/types';
import { Permission } from './permission.entity';
import { User } from './user.entity';

@Entity({ name: 'roles' })
export class Role implements Omit<RoleProto, 'permissions' | 'timestamps'> {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  // Many-to-many relationship with Permission
  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions!: Permission[];

  // Many-to-many relationship with User (through UserRole)
  @ManyToMany(() => User, (user) => user.roles)
  users!: User[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp with time zone' })
  deletedAt?: Date;

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
   * Convert TypeORM entity to protobuf format
   */
  toProto(): RoleProto {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      permissions:
        this.permissions?.map((permission) => permission.toProto()) || [],
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
   * Create entity from protobuf format
   */
  static fromProto(proto: Partial<RoleProto>): Role {
    const role = new Role();
    role.id = proto.id || '';
    role.name = proto.name || '';
    role.description = proto.description || '';
    return role;
  }
}
