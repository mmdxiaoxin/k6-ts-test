import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import http from 'k6/http';
import { Options } from 'k6/options';
import { ReqLogin } from '../../types/auth';

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

export const options: Options = {
  // 定义测试阶段
  stages: [
    { duration: '30s', target: 100 }, // 30秒内逐渐增加到100个并发用户
    { duration: '1m', target: 100 },  // 保持100个并发用户1分钟
    { duration: '30s', target: 0 },   // 30秒内逐渐减少到0个并发用户
  ],
  // 定义性能指标阈值
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95%的请求应该在1s内完成
    http_req_failed: ['rate<0.01'],   // 错误率应该低于1%
  },
};

// HTTP/2 请求配置
const http2Params = {
  headers: {
    'Content-Type': 'application/json',
  },
  http2: true, // 启用 HTTP/2
};

export default function () {
  // 随机选择一个测试账号
  const account = testData[Math.floor(Math.random() * testData.length)];

  // 1. 登录获取token
  const loginPayload: ReqLogin = {
    login: account.login,
    password: account.password,
  };

  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(loginPayload), http2Params);

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => r.json('access_token') !== undefined,
    'login uses HTTP/2': (r) => r.proto === 'HTTP/2.0',
  });

  const token = loginRes.json('access_token');

  // 设置通用请求头
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 2. 获取界面路由
  const routesRes = http.get(`${BASE_URL}/menu/routes`, { ...http2Params, headers });
  check(routesRes, {
    'routes status is 200': (r) => r.status === 200,
    'routes uses HTTP/2': (r) => r.proto === 'HTTP/2.0',
  });

  // 3. 获取角色字典
  const roleDictRes = http.get(`${BASE_URL}/role/dict`, { ...http2Params, headers });
  check(roleDictRes, {
    'role dict status is 200': (r) => r.status === 200,
    'role dict uses HTTP/2': (r) => r.proto === 'HTTP/2.0',
  });

  // 4. 获取用户信息
  const profileRes = http.get(`${BASE_URL}/user/profile`, { ...http2Params, headers });
  check(profileRes, {
    'profile status is 200': (r) => r.status === 200,
    'profile uses HTTP/2': (r) => r.proto === 'HTTP/2.0',
  });

  // 5. 获取头像
  const avatarRes = http.get(`${BASE_URL}/user/avatar`, { ...http2Params, headers });
  check(avatarRes, {
    'avatar status is 200': (r) => r.status === 200,
    'avatar uses HTTP/2': (r) => r.proto === 'HTTP/2.0',
  });

  // 6. 等待1秒
  sleep(1);
}
