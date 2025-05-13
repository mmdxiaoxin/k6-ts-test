import { DataSource } from "typeorm";
import { User } from "../models/user.entity";
import * as bcrypt from 'bcryptjs';

export async function checkPassword(dataSource: DataSource) {
  try {
    // 获取所有用户
    const users = await dataSource
      .getRepository(User)
      .createQueryBuilder("user")
      .getMany();

    // 存储密码为123456的用户
    const usersWithDefaultPassword = [];

    // 检查每个用户的密码
    for (const user of users) {
      const isDefaultPassword = await bcrypt.compare('123456', user.password);
      if (isDefaultPassword) {
        usersWithDefaultPassword.push({
          username: user.username,
          email: user.email
        });
      }
    }

    // 输出结果
    console.log('\n检查结果：');
    console.log(`总用户数：${users.length}`);
    console.log(`使用默认密码(123456)的用户数：${usersWithDefaultPassword.length}`);
    
    if (usersWithDefaultPassword.length > 0) {
      console.log('\n使用默认密码的用户列表：');
      usersWithDefaultPassword.forEach(user => {
        console.log(`用户名：${user.username}, 邮箱：${user.email}`);
      });
    }

    return {
      success: true,
      totalUsers: users.length,
      defaultPasswordUsers: usersWithDefaultPassword.length,
      usersWithDefaultPassword
    };
  } catch (error) {
    console.error("检查密码时发生错误:", error);
    return {
      success: false,
      error: error
    };
  }
} 