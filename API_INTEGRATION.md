# 底盘控制 API 对接说明

## ✅ 已完成的对接

### 1. API 封装 (`src/api/robotApi.ts`)

已创建两个核心函数：

#### `sendChassisControl(direction, speed)`
发送底盘控制命令

**参数映射：**
- 页面方向 → API 方向
  - `forward` → `forward` (前进)
  - `backward` → `reverse` (后退)
  - `left` → `turn_left` (左转)
  - `right` → `turn_right` (右转)
  - `stop` → `stop` (停止)

**请求示例：**
```
GET http://192.168.8.179:8080/robot/forward/75
GET http://192.168.8.179:8080/robot/reverse/50
GET http://192.168.8.179:8080/robot/turn_left/80
GET http://192.168.8.179:8080/robot/turn_right/60
GET http://192.168.8.179:8080/robot/stop/0
```

#### `setPowerStatus(isPowerOn)`
设置电源状态（开始/停止）

**参数映射：**
- `true` → `start` (开机)
- `false` → `stop` (关机)

**请求示例：**
```
GET http://192.168.8.179:8080/robot/start/0
GET http://192.168.8.179:8080/robot/stop/0
```

### 2. 组件集成 (`src/components/TankController.tsx`)

#### 功能对接：

1. **电源开关按钮**
   - 点击开机 → 发送 `{ direction: "start", speed: 0 }`
   - 点击关机 → 发送 `{ direction: "stop", speed: 0 }`

2. **前进/后退滑块**
   - 向上拖动 → 发送 `{ direction: "forward", speed: 0-100 }`
   - 向下拖动 → 发送 `{ direction: "reverse", speed: 0-100 }`
   - 松手回中 → 发送 `{ direction: "stop", speed: 0 }`

3. **左转/右转滑块**
   - 向左拖动 → 发送 `{ direction: "turn_left", speed: 0-100 }`
   - 向右拖动 → 发送 `{ direction: "turn_right", speed: 0-100 }`
   - 松手回中 → 发送 `{ direction: "stop", speed: 0 }`

#### 优化特性：

1. **节流控制**
   - 100ms 内最多发送一次命令
   - 避免高频调用导致服务器压力

2. **电源状态保护**
   - 只有开机状态才发送方向控制命令
   - 关机状态下滑块仍可操作，但不发送命令

3. **异步处理**
   - API 调用不阻塞 UI
   - 错误自动捕获并打印到控制台

## 🔧 配置说明

### API 地址配置

默认地址：`http://192.168.8.179:8080`

如需修改，可以：

1. **方式一：环境变量**
   ```bash
   # 创建 .env 文件
   echo "VITE_API_URL=http://你的IP:端口" > .env
   ```

2. **方式二：直接修改代码**
   编辑 `src/api/robotApi.ts` 第 4 行：
   ```typescript
   const API_BASE_URL = 'http://你的IP:端口';
   ```

## 🧪 测试方法

### 1. 打开浏览器控制台
按 F12 或右键 → 检查 → Console

### 2. 观察日志输出
- 发送命令时会打印：`发送底盘控制命令: { direction: "forward", speed: 75 }`
- 收到响应时会打印：`底盘控制响应: {...}`
- 出错时会打印：`发送底盘控制命令时出错: ...`

### 3. 测试步骤
1. 点击开机按钮 → 应该看到 `{ direction: "start", speed: 0 }`
2. 拖动前进滑块 → 应该看到 `{ direction: "forward", speed: XX }`
3. 拖动左转滑块 → 应该看到 `{ direction: "turn_left", speed: XX }`
4. 点击关机按钮 → 应该看到 `{ direction: "stop", speed: 0 }`

## ⚠️ 注意事项

1. **API 端点假设**
   - 当前假设端点为 `/chassis/control`
   - 如果实际端点不同，请修改 `robotApi.ts` 中的 URL

2. **CORS 问题**
   - 如果遇到跨域错误，需要后端配置 CORS
   - 或者使用代理配置（见下方）

3. **网络连接**
   - 确保前端设备和机器人在同一网络
   - 确保 IP 地址 `192.168.8.179` 可访问

## 🔄 Vite 代理配置（可选）

如果遇到 CORS 问题，可以在 `vite.config.ts` 中添加代理：

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.8.179:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

然后修改 `robotApi.ts` 中的 API_BASE_URL 为 `/api`

## 📊 API 调用流程

```
用户操作 → React State 更新 → 节流检查 → API 调用 → 后端处理 → 响应
   ↓                                                              ↓
UI 更新                                                    控制台日志
```

## 🐛 常见问题

### 1. 命令没有发送
- 检查是否已开机
- 查看控制台是否有错误
- 确认网络连接

### 2. 响应 404
- 检查 API 端点是否正确
- 查看 Swagger 文档确认实际路径

### 3. 响应 CORS 错误
- 后端需要配置 CORS 允许跨域
- 或使用 Vite 代理

### 4. 命令发送过于频繁
- 已实现 100ms 节流
- 如需调整，修改 `API_THROTTLE_MS` 常量
