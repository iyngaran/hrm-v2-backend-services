import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Employee } from './employee.entity';
import { Organization } from './organization.entity';

@Entity({ name: 'departments' })
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'code', type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({
    name: 'budget',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  budget?: number;

  // Foreign Keys
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'parent_department_id', type: 'uuid', nullable: true })
  parentDepartmentId?: string;

  @Column({ name: 'manager_id', type: 'uuid', nullable: true })
  managerId?: string;

  // Relationships
  @ManyToOne(() => Organization, (organization) => organization.departments)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @ManyToOne(() => Department, (department) => department.subDepartments)
  @JoinColumn({ name: 'parent_department_id' })
  parentDepartment?: Department;

  @OneToMany(() => Department, (department) => department.parentDepartment)
  subDepartments!: Department[];

  @ManyToOne(() => Employee, (employee) => employee.managedDepartments)
  @JoinColumn({ name: 'manager_id' })
  manager?: Employee;

  @OneToMany(() => Employee, (employee) => employee.department)
  employees!: Employee[];

  // Timestamps
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp with time zone' })
  deletedAt?: Date;
}
