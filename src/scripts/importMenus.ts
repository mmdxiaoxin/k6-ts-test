import * as fs from 'fs/promises';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { Menu } from '../models/menu.entity';

interface MenuData {
  id: number;
  icon: string;
  title: string;
  path: string;
  parentId: number | null;
  isLink: string | null;
  sort: number;
}

export async function importMenus(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    // 开始事务
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // 读取 menu.json 文件
    const menuJsonPath = path.join(__dirname, '../data/menu.json');
    const menuData = JSON.parse(await fs.readFile(menuJsonPath, 'utf-8')) as MenuData[];

    // 获取 Menu 仓库
    const menuRepository = queryRunner.manager.getRepository(Menu);

    // 删除现有菜单数据
    await menuRepository.delete({});

    // 创建菜单映射，用于存储 id 和实体实例的对应关系
    const menuMap = new Map<number, Menu>();

    // 第一次遍历：创建所有菜单实例
    for (const menuItem of menuData) {
      const menu = new Menu();
      menu.icon = menuItem.icon;
      menu.title = menuItem.title;
      menu.path = menuItem.path;
      menu.sort = menuItem.sort;
      menu.isLink = menuItem.isLink || null;
      
      // 保存到数据库并获取生成的 id
      const savedMenu = await menuRepository.save(menu);
      menuMap.set(menuItem.id, savedMenu);
    }

    // 第二次遍历：建立父子关系
    for (const menuItem of menuData) {
      if (menuItem.parentId) {
        const menu = menuMap.get(menuItem.id);
        const parentMenu = menuMap.get(menuItem.parentId);
        
        if (menu && parentMenu) {
          menu.parent = parentMenu;
          await menuRepository.save(menu);
        }
      }
    }

    // 提交事务
    await queryRunner.commitTransaction();
    console.log('菜单数据导入成功！');
  } catch (error) {
    // 回滚事务
    await queryRunner.rollbackTransaction();
    console.error('导入菜单数据时发生错误:', error);
    throw error;
  } finally {
    // 释放查询运行器
    await queryRunner.release();
  }
}