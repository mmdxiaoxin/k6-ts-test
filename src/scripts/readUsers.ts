import { DataSource } from "typeorm";
import { User } from "../models/user.entity";

interface ReadUsersOptions {
  roleNames?: string[];
}

export async function readUsers(
  dataSource: DataSource,
  options: ReadUsersOptions = {}
) {
  try {
    // 构建查询
    const queryBuilder = dataSource
      .getRepository(User)
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.roles", "role");

    // 如果指定了角色，添加角色过滤条件
    if (options.roleNames && options.roleNames.length > 0) {
      queryBuilder.where("role.name IN (:...roleNames)", {
        roleNames: options.roleNames
      });
    }

    // 执行查询
    const users = await queryBuilder.getMany();
    
    // 提取用户名数组
    const usernames = users.map(user => user.username);

    return {
      success: true,
      usernames: usernames,
      count: usernames.length
    };
  } catch (error) {
    console.error("读取用户时发生错误:", error);
    return {
      success: false,
      error: error
    };
  }
} 