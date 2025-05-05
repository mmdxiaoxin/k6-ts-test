import { User } from '../models/user.entity';
import { Role } from '../models/role.entity';
import { Profile } from '../models/profile.entity';
import { faker } from '@faker-js/faker/locale/zh_CN';

export class DataGenerator {
  /**
   * 生成随机用户数据
   */
  static generateUser(): User {
    const user = new User();
    user.email = faker.internet.email();
    user.username = faker.internet.username();
    user.password = faker.internet.password();
    user.status = Math.random() > 0.5 ? 1 : 0;
    
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
  static generateUsers(count: number): User[] {
    return Array.from({ length: count }, () => this.generateUser());
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
