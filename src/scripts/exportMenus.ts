import { Menu } from '../models/menu.entity';
import { Role } from '../models/role.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AppDataSource } from '../main';

export async function exportMenus(): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const menuRepository = AppDataSource.getRepository(Menu);
    
    // 获取所有菜单数据，包括关联的角色
    const menus = await menuRepository.find({
      relations: ['roles'],
      order: {
        sort: 'ASC'
      }
    });

    // 处理数据，移除循环引用
    const processedMenus = menus.map((menu: Menu) => ({
      id: menu.id,
      icon: menu.icon,
      title: menu.title,
      path: menu.path,
      sort: menu.sort,
      parentId: menu.parentId,
      isLink: menu.isLink,
      roles: menu.roles.map((role: Role) => role.name)
    }));

    // 创建导出目录
    const exportDir = path.join(process.cwd(), 'exports');
    await fs.mkdir(exportDir, { recursive: true });

    // 导出为JSON文件
    const exportPath = path.join(exportDir, 'menus.json');
    await fs.writeFile(exportPath, JSON.stringify(processedMenus, null, 2));

    return {
      success: true,
      message: `菜单数据已成功导出到: ${exportPath}`,
      data: processedMenus
    };
  } catch (error) {
    return {
      success: false,
      message: `导出菜单数据失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 