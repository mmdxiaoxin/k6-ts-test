import { DataSource } from "typeorm";
import { User } from "../models/user.entity";
import { Role } from "../models/role.entity";
import { DataGenerator } from "../utils/generate";
import { faker } from "@faker-js/faker";
import { In } from "typeorm";

interface GenerateUsersOptions {
  count?: number;
  roleNames?: string[];
}

export async function generateUsers(
  dataSource: DataSource,
  options: GenerateUsersOptions = {}
) {
  const {
    count = 5,
    roleNames = ['user']
  } = options;

  try {
    // 从数据库读取指定名称的角色
    const roles = await dataSource
      .getRepository(Role)
      .findBy({ name: In(roleNames) });

    if (roles.length === 0) {
      console.log(`数据库中没有找到指定的角色: ${roleNames.join(', ')}`);
      return {
        success: false,
        error: `数据库中没有找到指定的角色: ${roleNames.join(', ')}`
      };
    }

    // 检查是否所有请求的角色都找到了
    const foundRoleNames = roles.map(role => role.name);
    const missingRoles = roleNames.filter(name => !foundRoleNames.includes(name));
    if (missingRoles.length > 0) {
      console.log(`以下角色未找到: ${missingRoles.join(', ')}`);
      return {
        success: false,
        error: `以下角色未找到: ${missingRoles.join(', ')}`
      };
    }

    console.log(`读取到角色:`, roles.map(role => role.name).join(', '));

    // 生成并保存用户
    const users = await DataGenerator.generateUsers(count);
    const savedUsers = await dataSource.manager.save(users);
    console.log("用户创建成功:", savedUsers);

    // 为每个用户分配所有指定角色
    for (const user of savedUsers) {
      user.roles = roles;
      await dataSource.manager.save(user);
    }
    console.log(`用户角色分配完成，每个用户分配了以下角色: ${roleNames.join(', ')}`);

    return {
      success: true,
      users: savedUsers,
      roles: roles
    };
  } catch (error) {
    console.error("生成用户时发生错误:", error);
    return {
      success: false,
      error: error
    };
  }
} 