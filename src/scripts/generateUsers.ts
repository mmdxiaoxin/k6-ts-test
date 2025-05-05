import { DataSource } from "typeorm";
import { User } from "../models/user.entity";
import { Role } from "../models/role.entity";
import { DataGenerator } from "../utils/generate";
import { faker } from "@faker-js/faker";

export async function generateUsers(
  dataSource: DataSource,
  count: number = 5
) {
  try {
    // 从数据库读取已有角色
    const existingRoles = await dataSource.manager.find(Role);
    if (existingRoles.length === 0) {
      console.log("数据库中没有角色，请先创建角色");
      return {
        success: false,
        error: "数据库中没有角色"
      };
    }
    console.log("读取到已有角色:", existingRoles);

    // 生成并保存用户
    const users = DataGenerator.generateUsers(count);
    const savedUsers = await dataSource.manager.save(users);
    console.log("用户创建成功:", savedUsers);

    // 为每个用户随机分配已有角色
    for (const user of savedUsers) {
      user.roles = faker.helpers.arrayElements(existingRoles, { min: 1, max: 3 });
      await dataSource.manager.save(user);
    }
    console.log("用户角色分配完成");

    return {
      success: true,
      users: savedUsers,
      roles: existingRoles
    };
  } catch (error) {
    console.error("生成用户时发生错误:", error);
    return {
      success: false,
      error: error
    };
  }
} 