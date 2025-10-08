import Long from 'long';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ActionType,
  PermissionScope,
  ResourceType,
} from '../../../../../generated/typescript/common/types';
import { Timestamp } from '../../../../../generated/typescript/google/protobuf/timestamp';
import { Permission as PermissionProto } from '../../../../../generated/typescript/user-service/users/types';
import { Role } from './role.entity';

@Entity({ name: 'permissions' })
export class Permission implements Omit<PermissionProto, 'timestamps'> {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({
    type: 'enum',
    enum: ResourceType,
    default: ResourceType.RESOURCE_TYPE_UNSPECIFIED,
  })
  resource!: ResourceType;

  @Column({
    type: 'enum',
    enum: ActionType,
    default: ActionType.ACTION_TYPE_UNSPECIFIED,
  })
  action!: ActionType;

  @Column({
    type: 'enum',
    enum: PermissionScope,
    default: PermissionScope.PERMISSION_SCOPE_UNSPECIFIED,
  })
  scope!: PermissionScope;

  // Many-to-many relationship with Role
  @ManyToMany(() => Role, (role) => role.permissions)
  roles!: Role[];

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
  toProto(): PermissionProto {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      resource: this.resource,
      action: this.action,
      scope: this.scope,
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
  static fromProto(proto: Partial<PermissionProto>): Permission {
    const permission = new Permission();
    permission.id = proto.id || '';
    permission.name = proto.name || '';
    permission.description = proto.description || '';
    permission.resource =
      proto.resource || ResourceType.RESOURCE_TYPE_UNSPECIFIED;
    permission.action = proto.action || ActionType.ACTION_TYPE_UNSPECIFIED;
    permission.scope =
      proto.scope || PermissionScope.PERMISSION_SCOPE_UNSPECIFIED;
    return permission;
  }
}
