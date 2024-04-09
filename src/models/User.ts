import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { UserProfile } from "./UserProfile";
import jwt from "jsonwebtoken";
import { Enrollment } from "./Enrollment";
import { Course } from "./Course";

export enum UserRole {
  USER = "user",
  SUPERADMIN = "superadmin",
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @OneToOne(() => UserProfile, (userProfile) => userProfile.user)
  @JoinColumn()
  profile!: UserProfile;

  @OneToMany(() => Course, (course) => course.createdBy)
  coursesCreated!: Course[];

  generateToken(): string {
    return jwt.sign({ userId: this.id }, process.env.JWT_SECRET_KEY as string, {
      expiresIn: "1d",
    });
  }
}
