
import User, { IUser } from "./user.model";

class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select("+password");
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }
}

export default new UserRepository();
