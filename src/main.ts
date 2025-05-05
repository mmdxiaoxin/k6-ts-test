import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Menu } from "./models/menu.entity";
import { Profile } from "./models/profile.entity";
import { Role } from "./models/role.entity";
import { User } from "./models/user.entity";
import { readUsers } from "./scripts/readUsers";

// 加载环境变量
dotenv.config();

// 创建数据库连接
const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_DATABASE || 'test',
  synchronize: true, // 开发环境可以使用，生产环境建议关闭
  logging: true,
  entities: [User, Role, Profile, Menu],
  migrations: [],
  subscribers: [],
});

// 初始化数据库连接
AppDataSource.initialize()
  .then(async () => {
    console.log("数据库连接成功");

    // 读取所有用户
    const allUsers = await readUsers(AppDataSource);
    if (allUsers.success) {
      console.log(`找到 ${allUsers.count} 个用户:`);
      console.log(allUsers.usernames);

      // 导出所有用户名到JSON文件
      const outputPath = path.join(__dirname, '../output/all_users.json');
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(
        outputPath,
        JSON.stringify(allUsers.usernames, null, 2),
        'utf-8'
      );
      console.log(`\n所有用户名已导出到: ${outputPath}`);
    }

    // 读取具有特定角色的用户
    const expertUsers = await readUsers(AppDataSource, {
      roleNames: ['expert']
    });
    if (expertUsers.success) {
      console.log(`\n找到 ${expertUsers.count} 个特定角色用户:`);
      console.log(expertUsers.usernames);

      // 导出特定角色用户名到JSON文件
      const outputPath = path.join(__dirname, '../output/special_users.json');
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(
        outputPath,
        JSON.stringify(expertUsers.usernames, null, 2),
        'utf-8'
      );
      console.log(`特定角色用户名已导出到: ${outputPath}`);
    }

    // 关闭数据库连接
    await AppDataSource.destroy();
    console.log("\n数据库连接已关闭");
    
    // 终止程序
    process.exit(0);
  })
  .catch(async (error) => {
    console.log("数据库连接失败:", error);
    // 确保在错误情况下也关闭数据库连接
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  });