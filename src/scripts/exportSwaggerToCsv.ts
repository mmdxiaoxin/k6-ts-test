import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';

interface SwaggerPath {
  [key: string]: {
    [method: string]: {
      summary: string;
      description?: string;
      tags?: string[];
      parameters?: Array<{
        name: string;
        in: string;
        description?: string;
        required?: boolean;
        schema?: {
          type: string;
        };
      }>;
      requestBody?: {
        content: {
          [key: string]: {
            schema: {
              type: string;
              properties?: {
                [key: string]: {
                  type: string;
                  description?: string;
                };
              };
            };
          };
        };
      };
      responses: {
        [key: string]: {
          description: string;
          content?: {
            [key: string]: {
              schema: {
                type: string;
                properties?: {
                  [key: string]: {
                    type: string;
                    description?: string;
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}

interface SwaggerDoc {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: SwaggerPath;
}

export async function exportSwaggerToCsv(swaggerUrl: string) {
  try {
    // 获取Swagger文档
    console.log('正在获取Swagger文档...');
    const response = await axios.get(swaggerUrl);
    const swaggerDoc: SwaggerDoc = response.data;
    console.log(`成功获取Swagger文档，版本: ${swaggerDoc.openapi}`);
    console.log(`API标题: ${swaggerDoc.info.title}`);
    console.log(`API版本: ${swaggerDoc.info.version}`);

    // 准备CSV内容
    let csvContent = "序号,模块名称,接口路径,请求方法,接口描述\n";
    
    // 统计信息
    let totalPaths = 0;
    let totalMethods = 0;
    let skippedPaths = 0;
    let skippedMethods = 0;
    let apiIndex = 1; // 添加序号计数器
    
    // 处理每个路径
    console.log('\n开始处理API路径...');
    for (const [path, pathItem] of Object.entries(swaggerDoc.paths)) {
      totalPaths++;
      console.log(`\n处理路径: ${path}`);
      
      // 处理每个方法
      for (const [method, operation] of Object.entries(pathItem)) {
        totalMethods++;
        console.log(`  处理${method.toUpperCase()}方法: ${operation.summary || '无描述'}`);
        
        try {
          // 获取模块名称（tags）
          const moduleName = operation.tags?.[0] || '未分类';
          
          // 添加到CSV，序号不加引号，其他字段保持引号
          csvContent += `${apiIndex},"${moduleName}","${path}","${method.toUpperCase()}","${operation.summary || ''}"\n`;
          apiIndex++; // 增加序号
        } catch (error: any) {
          console.error(`  处理失败: ${error.message}`);
          skippedMethods++;
        }
      }
    }

    // 确保输出目录存在
    const outputDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outputDir, { recursive: true });

    // 写入CSV文件
    const outputPath = path.join(outputDir, 'api_documentation.csv');
    await fs.writeFile(outputPath, csvContent, 'utf-8');

    // 输出统计信息
    console.log('\n处理完成，统计信息：');
    console.log(`总路径数: ${totalPaths}`);
    console.log(`总方法数: ${totalMethods}`);
    console.log(`跳过的路径数: ${skippedPaths}`);
    console.log(`跳过的方法数: ${skippedMethods}`);
    console.log(`成功处理的方法数: ${totalMethods - skippedMethods}`);

    return {
      success: true,
      message: `API文档已成功导出到: ${outputPath}`,
      apiCount: totalMethods - skippedMethods,
      statistics: {
        totalPaths,
        totalMethods,
        skippedPaths,
        skippedMethods
      }
    };
  } catch (error: any) {
    console.error("导出API文档时发生错误:", error);
    return {
      success: false,
      error: error
    };
  }
} 