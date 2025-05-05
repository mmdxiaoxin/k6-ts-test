import { DataSource } from "typeorm";
import { User } from "../models/user.entity";
import { Profile } from "../models/profile.entity";

export async function deleteUsers(
  dataSource: DataSource,
  keepUsernames: string[] = ['admin', 'mmdxiaoxin', '2021013237']
) {
  try {
    // 先找到要删除的用户
    const usersToDelete = await dataSource
      .getRepository(User)
      .createQueryBuilder("user")
      .where("user.username NOT IN (:...usernames)", {
        usernames: keepUsernames
      })
      .getMany();

    console.log(`找到 ${usersToDelete.length} 个要删除的用户`);

    // 删除这些用户的档案
    for (const user of usersToDelete) {
      await dataSource
        .getRepository(Profile)
        .createQueryBuilder()
        .delete()
        .where("userId = :userId", { userId: user.id })
        .execute();
    }

    // 删除这些用户
    for (const user of usersToDelete) {
      await dataSource
        .getRepository(User)
        .createQueryBuilder()
        .delete()
        .where("id = :id", { id: user.id })
        .execute();
    }

    console.log(`成功删除 ${usersToDelete.length} 个用户`);

    // 查询剩余用户
    const remainingUsers = await dataSource.manager.find(User);
    console.log("剩余用户:", remainingUsers.map(user => user.username));

    return {
      success: true,
      deletedCount: usersToDelete.length,
      remainingUsers: remainingUsers
    };
  } catch (error) {
    console.error("删除用户时发生错误:", error);
    return {
      success: false,
      error: error
    };
  }
} 