import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
import { Course } from "./Course";
import { Enrollment } from "./Enrollment";

@Entity()
export class UserProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  profilePicture!: string;

  @OneToOne(() => User, (User) => User.profile)
  user!: User;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.user)
  enrollments!: Enrollment[];
}
