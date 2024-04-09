import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
} from "typeorm";
import { User } from "../models/User";
import bcrypt from "bcryptjs";

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }
  beforeInsert(event: InsertEvent<User>) {
    if (event.entity.password) {
      event.entity.password = bcrypt.hashSync(event.entity.password, 8);
    }
  }
}
