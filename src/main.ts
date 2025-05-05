import "reflect-metadata"
import { DataSource } from "typeorm";
import { User } from "./models/user.entity";
import { Role } from "./models/role.entity";
import { Profile } from "./models/profile.entity";
import { Menu } from "./models/menu.entity";
import { DataGenerator } from "./utils/generate";
import { faker } from "@faker-js/faker";
import * as dotenv from 'dotenv';

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

    // 从数据库读取已有角色
    const existingRoles = await AppDataSource.manager.find(Role);
    if (existingRoles.length === 0) {
      console.log("数据库中没有角色，请先创建角色");
      return;
    }
    console.log("读取到已有角色:", existingRoles);

    // 生成并保存用户
    const users = DataGenerator.generateUsers(5);
    const savedUsers = await AppDataSource.manager.save(users);
    console.log("用户创建成功:", savedUsers);

    // 为每个用户随机分配已有角色
    for (const user of savedUsers) {
      user.roles = faker.helpers.arrayElements(existingRoles, { min: 1, max: 3 });
      await AppDataSource.manager.save(user);
    }
    console.log("用户角色分配完成");

  })
  .catch((error) => console.log("数据库连接失败:", error));