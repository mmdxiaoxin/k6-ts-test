import { check, sleep } from 'k6';
import http from 'k6/http';
import { Options } from 'k6/options';
import { ReqLogin } from '../../types/auth';

const BASE_URL = 'https://www.mmdxiaoxin.top/api';

export const options: Options = {
  vus: 1,
  duration: '30s',
};

export default function () {
  // 1. 登录获取token
  const loginPayload: ReqLogin = {
    login: 'admin',
    password: '123456',
  };

  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(loginPayload), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => r.json('access_token') !== undefined,
  });

  const token = loginRes.json('access_token');

  // 设置通用请求头
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 2. 获取界面路由
  const routesRes = http.get(`${BASE_URL}/menu/routes`, { headers });
  check(routesRes, {
    'routes status is 200': (r) => r.status === 200,
  });

  // 3. 获取角色字典
  const roleDictRes = http.get(`${BASE_URL}/role/dict`, { headers });
  check(roleDictRes, {
    'role dict status is 200': (r) => r.status === 200,
  });

  // 4. 获取用户信息
  const profileRes = http.get(`${BASE_URL}/user/profile`, { headers });
  check(profileRes, {
    'profile status is 200': (r) => r.status === 200,
  });

  // 5. 获取头像
  const avatarRes = http.get(`${BASE_URL}/user/avatar`, { headers });
  check(avatarRes, {
    'avatar status is 200': (r) => r.status === 200,
  });

  // 6. 等待1秒
  sleep(1);
}
