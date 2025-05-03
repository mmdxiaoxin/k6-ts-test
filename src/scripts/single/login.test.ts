import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import http from 'k6/http';

// 测试配置
export const options = {
  // 定义测试阶段
  stages: [
    { duration: '10s', target: 1000 }, // 30秒内逐渐增加到10个并发用户
    { duration: '20s', target: 100 }, // 保持10个并发用户1分钟
    { duration: '10s', target: 0 }, // 30秒内逐渐减少到0个并发用户
  ],
  // 定义性能指标阈值
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95%的请求应该在500ms内完成
    http_req_failed: ['rate<0.01'], // 错误率应该低于1%
  },
  // 输出配置
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)'],
};

// 测试数据
const testData = new SharedArray('test data', function () {
  return [
    {
      login: 'admin',
      password: '123456',
    },
    {
      login: 'mmdxiaoxin',
      password: '123456',
    },
  ];
});

// 测试函数
export default function () {
  // 随机选择一个测试账号
  const account = testData[Math.floor(Math.random() * testData.length)];

  // 测试登录接口
  const url = 'https://www.mmdxiaoxin.top/api/auth/login';
  const payload = JSON.stringify({
    login: account.login,
    password: account.password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '30s',
  };

  const res = http.post(url, payload, params);

  // 打印响应内容（无论成功或失败）
  console.log(`响应状态码: ${res.status}`);
  console.log(`响应内容: ${res.body}`);

  // 检查响应
  check(res, {
    状态码是200: (r) => r.status === 200,
    响应时间小于500ms: (r) => r.timings.duration < 500,
    响应包含token: (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.data && body.data.access_token;
      } catch (e) {
        return false;
      }
    },
  });

  // 每次请求之间等待1秒
  sleep(1);
}
