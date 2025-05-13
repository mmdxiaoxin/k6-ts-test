import { DataSource } from "typeorm";
import { User } from "../models/user.entity";
import * as fs from 'fs/promises';
import * as path from 'path';

export async function exportUsersToCsv(dataSource: DataSource) {
  try {
    // 获取所有用户
    const users = await dataSource
      .getRepository(User)
      .createQueryBuilder("user")
      .getMany();

    // 准备CSV内容
    let csvContent = "login,password\n";
    
    // 处理每个用户
    for (const user of users) {
      // 将用户数据添加到CSV，直接使用加密后的密码
      csvContent += `${user.username},${user.password}\n`;
    }

    // 确保输出目录存在
    const outputDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outputDir, { recursive: true });

    // 写入CSV文件
    const outputPath = path.join(outputDir, 'users.csv');
    await fs.writeFile(outputPath, csvContent, 'utf-8');

    return {
      success: true,
      message: `用户数据已成功导出到: ${outputPath}`,
      count: users.length
    };
  } catch (error) {
    console.error("导出用户数据时发生错误:", error);
    return {
      success: false,
      error: error
    };
  }
} 