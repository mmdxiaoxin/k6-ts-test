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
import { generateUsers } from './scripts/generateUsers';
import { importMenus } from './scripts/importMenus';

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
    // ___________________________________________
    // 脚本开始

    // 导入菜单数据
    await importMenus(AppDataSource);

    // 脚本结束
    // ___________________________________________
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