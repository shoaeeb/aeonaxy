import {
  Column,
  Entity,
  IntegerType,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
import { UserProfile } from "./UserProfile";
import { Enrollment } from "./Enrollment";

export enum CourseLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

@Entity()
export class Course {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column()
  price!: number;

  @Column({ type: "enum", enum: CourseLevel, default: CourseLevel.BEGINNER })
  level!: CourseLevel;

  @Column()
  instructor!: string;

  //in minutes
  @Column({ type: "float", default: 0 })
  duration!: number;

  @Column({ default: "" })
  image!: string;

  @Column({ type: "float", default: 3.5 })
  rating!: number;

  @ManyToOne(() => User, (user) => user.coursesCreated)
  @JoinColumn()
  createdBy!: User;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments!: Enrollment[];
}
