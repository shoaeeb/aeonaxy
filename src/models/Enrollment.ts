import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserProfile } from "./UserProfile";
import { Course } from "./Course";

@Entity()
export class Enrollment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.enrollments)
  user!: UserProfile;

  @ManyToOne(() => Course, (course) => course.enrollments)
  course!: Course;
}
