import { faker } from '@faker-js/faker/locale/zh_CN';
import * as bcrypt from 'bcryptjs';
import { Profile } from '../models/profile.entity';
import { Role } from '../models/role.entity';
import { User } from '../models/user.entity';

export class DataGenerator {
  /**
   * 生成随机用户数据
   */
  static async generateUser(password: string = '123456'): Promise<User> {
    const user = new User();
    user.email = faker.internet.email();
    user.username = faker.internet.username();
    // 使用bcrypt加密密码
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.status = 1;
    
    // 生成个人资料
    const profile = new Profile();
    profile.name = faker.person.fullName();
    profile.avatar = faker.image.avatar();
    profile.phone = faker.phone.number();
    profile.address = faker.location.streetAddress();
    user.profile = profile;

    return user;
  }

  /**
   * 生成多个用户数据
   */
  static async generateUsers(count: number, password: string = '123456'): Promise<User[]> {
    const users = await Promise.all(
      Array.from({ length: count }, () => this.generateUser(password))
    );
    return users;
  }

  /**
   * 生成角色数据
   */
  static generateRole(): Role {
    const role = new Role();
    role.name = faker.helpers.arrayElement(['admin', 'user', 'expert']);
    return role;
  }

  /**
   * 生成多个角色数据
   */
  static generateRoles(count: number): Role[] {
    return Array.from({ length: count }, () => this.generateRole());
  }
}
