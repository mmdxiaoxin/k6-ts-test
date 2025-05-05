import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import http from 'k6/http';
import { Options } from 'k6/options';
import { ReqLogin } from '../../types/auth';
import { DiagnosisSupport } from '../../types/diagnosis';

const BASE_URL = 'https://www.mmdxiaoxin.top/api';

interface TestAccount {
  login: string;
  password: string;
}

// 测试数据
const testData = new SharedArray<TestAccount>('test data', function () {
  const users: string[] = JSON.parse(open('../../data/all_users.json'));
  return users.map((login: string) => ({
    login,
    password: '123456'
  }));
});

// 图片数据
const testImage = open('../../data/images/t1.jpg', 'b');

export const options: Options = {
  // 设置虚拟用户数和迭代次数
  vus: 10,        // 10个虚拟用户
  iterations: 10, // 总共执行10次迭代
  // 定义性能指标阈值
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95%的请求应该在3s内完成
    http_req_failed: ['rate<0.05'],   // 错误率应该低于5%
  },
  // DNS 配置
  dns: {
    ttl: '1h',    // DNS 缓存时间
    select: 'first', // 使用第一个 IP 地址
    policy: 'preferIPv4' // 优先使用 IPv4
  }
};

// HTTP/2 请求配置
const http2Params = {
  headers: {
    'Content-Type': 'application/json'
  },
  http2: true, // 启用 HTTP/2
  timeout: '30s', // 设置请求超时时间
};

// 随机延时函数
function randomSleep(min: number, max: number) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  sleep(delay);
}

export default function () {
  // 随机选择一个测试账号
  const account = testData[Math.floor(Math.random() * testData.length)];

  // 1. 登录获取token
  const loginPayload: ReqLogin = {
    login: account.login,
    password: account.password,
  };

  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(loginPayload), http2Params);

  // 检查登录响应
  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => {
      try {
        return r.json('data.access_token') !== undefined;
      } catch (e) {
        console.error('登录响应解析失败:', e);
        return false;
      }
    }
  });

  // 如果登录失败，直接返回
  if (loginRes.status !== 200) {
    console.error('登录失败:', loginRes.status, loginRes.body);
    return;
  }

  const token = loginRes.json('data.access_token');

  // 设置通用请求头
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 2. 获取界面路由
  const routesRes = http.get(`${BASE_URL}/menu/routes`, { ...http2Params, headers });
  check(routesRes, {
    'routes status is 200': (r) => r.status === 200
  });

  // 路由加载后等待0.5-2秒
  randomSleep(0.5, 2);

  // 3. 获取角色字典
  const roleDictRes = http.get(`${BASE_URL}/role/dict`, { ...http2Params, headers });
  check(roleDictRes, {
    'role dict status is 200': (r) => r.status === 200
  });

  // 角色字典加载后等待0.5-2秒
  randomSleep(0.5, 2);

  // 4. 获取用户信息
  const profileRes = http.get(`${BASE_URL}/user/profile`, { ...http2Params, headers });
  check(profileRes, {
    'profile status is 200': (r) => r.status === 200
  });

  // 用户信息加载后等待0.5-2秒
  randomSleep(0.5, 2);

  // 5. 获取头像
  const avatarRes = http.get(`${BASE_URL}/user/avatar`, { ...http2Params, headers });
  check(avatarRes, {
    'avatar status is 200': (r) => r.status === 200
  });

  // 等待1秒
  sleep(1);

  // 6. 获取运行中的服务
  const supportRes = http.get(`${BASE_URL}/diagnosis/support`, { ...http2Params, headers });
  check(supportRes, {
    'support status is 200': (r) => r.status === 200
  });

  // 从诊断支持中随机选择一个配置
  const supportData = supportRes.json('data') as DiagnosisSupport[];
  if (!supportData || supportData.length === 0) {
    console.error('没有可用的诊断支持配置');
    return;
  }
  const randomSupport = supportData[Math.floor(Math.random() * supportData.length)];

  // 等待5秒
  sleep(5);

  // 7. 上传待诊断数据
  const formData = {
    file: http.file(testImage, 'test.jpg', 'image/jpeg')
  };
  
  const uploadRes = http.post(`${BASE_URL}/diagnosis/upload`, formData, {
    ...http2Params,
    headers: {
      ...headers,
      'Content-Type': 'multipart/form-data'
    }
  });
  check(uploadRes, {
    'upload status is 201': (r) => r.status === 201
  });

  // 如果上传失败，直接返回
  if (uploadRes.status !== 201) {
    console.error('上传失败:', uploadRes.status, uploadRes.body);
    return;
  }

  // 等待1秒
  sleep(1);

  // 8. 进行诊断
  const diagnosisId = uploadRes.json('data.id');
  if (!diagnosisId) {
    console.error('获取诊断ID失败');
    return;
  }

  const startDiagnosisRes = http.post(
    `${BASE_URL}/diagnosis/${diagnosisId}/start`,
    JSON.stringify({
      serviceId: randomSupport.value.serviceId,
      configId: randomSupport.value.configId
    }),
    { ...http2Params, headers }
  );
  check(startDiagnosisRes, {
    'start diagnosis status is 201': (r) => r.status === 201
  });

  // 如果诊断启动失败，直接返回
  if (startDiagnosisRes.status !== 201) {
    console.error('诊断启动失败:', startDiagnosisRes.status, startDiagnosisRes.body);
    return;
  }

  // 等待1秒
  sleep(1);

  // 9. 获取诊断历史
  const historyRes = http.get(`${BASE_URL}/diagnosis/history/list?page=1&pageSize=5`, { ...http2Params, headers });
  check(historyRes, {
    'history status is 200': (r) => r.status === 200
  });

  // 等待1秒
  sleep(1);

  // 10. 获取病害知识
  const knowledgeRes = http.get(`${BASE_URL}/knowledge/list?page=1&pageSize=10`, { ...http2Params, headers });
  check(knowledgeRes, {
    'knowledge status is 200': (r) => r.status === 200
  });

  // 最后等待1-3秒
  randomSleep(1, 3);
}
