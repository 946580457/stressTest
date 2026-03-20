# Vue 3 高强度压力测试 Demo

## 技术栈

- Vue 3
- Element Plus
- Vuex 4
- Axios
- Vite

## 启动

```bash
npm install
npm run mock
npm run dev
```

前端地址：

- http://127.0.0.1:5173

Mock 接口：

- http://127.0.0.1:3001/api/stress

## 功能

- 配置请求总数、并发数、轮次、超时、失败率、延迟区间
- 实时统计成功数、失败数、平均耗时、峰值耗时、QPS
- 内置 mock 服务，方便本地演示和前端联调
