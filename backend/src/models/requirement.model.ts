import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  Index,
} from 'typeorm';

/**
 * Requirement entity for SDLC traceability.
 * Each requirement is uniquely identified and linked to SDLC artifacts.
 */
@Entity({ name: 'requirements' })
export class Requirement {
  /**
   * Unique identifier for the requirement (UUID).
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Human-readable requirement title.
   */
  @Column({ type: 'varchar', length: 255 })
  @Index()
  title: string;

  /**
   * Detailed description of the requirement.
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * Business or compliance priority.
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  priority?: string;

  /**
   * Status of the requirement (e.g., Draft, Approved, In Progress, Completed).
   */
  @Column({ type: 'varchar', length: 50, default: 'Draft' })
  status: string;

  /**
   * User stories linked to this requirement (external IDs).
   */
  @Column('simple-array', { nullable: true })
  userStoryIds?: string[];

  /**
   * Tasks linked to this requirement (external IDs).
   */
  @Column('simple-array', { nullable: true })
  taskIds?: string[];

  /**
   * Test cases linked to this requirement (external IDs).
   */
  @Column('simple-array', { nullable: true })
  testCaseIds?: string[];

  /**
   * Code commits linked to this requirement (external IDs, e.g., commit hashes).
   */
  @Column('simple-array', { nullable: true })
  codeCommitIds?: string[];

  /**
   * Deployment records linked to this requirement (external IDs).
   */
  @Column('simple-array', { nullable: true })
  deploymentIds?: string[];

  /**
   * Flag for failed tests associated with this requirement.
   */
  @Column({ type: 'boolean', default: false })
  hasFailedTests: boolean;

  /**
   * Flag for deployment rollbacks associated with this requirement.
   */
  @Column({ type: 'boolean', default: false })
  hasDeploymentRollback: boolean;

  /**
   * User who created the requirement.
   */
  @Column({ type: 'varchar', length: 100 })
  createdBy: string;

  /**
   * User who last updated the requirement.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  updatedBy?: string;

  /**
   * Timestamp when the requirement was created.
   */
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /**
   * Timestamp when the requirement was last updated.
   */
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

export default Requirement;