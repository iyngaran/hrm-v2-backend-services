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
import { Department } from './department.entity';
import { Organization } from './organization.entity';

@Entity({ name: 'employees' })
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'employee_id', type: 'varchar', length: 50, unique: true })
  employeeId!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'phone', type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ name: 'hire_date', type: 'date' })
  hireDate!: Date;

  @Column({ name: 'termination_date', type: 'date', nullable: true })
  terminationDate?: Date;

  @Column({ name: 'job_title', type: 'varchar', length: 255 })
  jobTitle!: string;

  @Column({
    name: 'salary',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  salary?: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({
    name: 'employee_status',
    type: 'varchar',
    length: 50,
    default: 'active',
  })
  employeeStatus!: string;

  // Foreign Keys
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId?: string;

  @Column({ name: 'manager_id', type: 'uuid', nullable: true })
  managerId?: string;

  // Relationships
  @ManyToOne(() => Organization, (organization) => organization.employees)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @ManyToOne(() => Department, (department) => department.employees)
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @ManyToOne(() => Employee, (employee) => employee.subordinates)
  @JoinColumn({ name: 'manager_id' })
  manager?: Employee;

  @OneToMany(() => Employee, (employee) => employee.manager)
  subordinates!: Employee[];

  @OneToMany(() => Department, (department) => department.manager)
  managedDepartments!: Department[];

  // Timestamps
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp with time zone' })
  deletedAt?: Date;
}
