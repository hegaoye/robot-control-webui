# 更新日志

## [1.1.0] - 2025-10-04

### 变更
- 滑块归零时使用 `pause` 代替 `stop`
- 前进、后退、左转、右转滑块松手归零时统一发送 `GET /robot/pause/0`
- 保持电源关机按钮使用 `stop`

### 接口映射
- 前进 → `forward`
- 后退 → `reverse`
- 左转 → `turn_left`
- 右转 → `turn_right`
- 滑块归零 → `pause` (新)
- 开机 → `start`
- 关机 → `stop`

## [1.0.0] - 2025-10-04

### 新增
- 履带车遥控器界面
- 前进/后退垂直滑块控制
- 左转/右转水平滑块控制
- 速度设置（0-100）
- 电源开关按钮（开机/关机）
- 实时状态显示（方向、速度）
- API 接口对接
- Vite 代理配置解决 CORS 问题
- 节流优化（100ms）

### 技术栈
- React 18
- TypeScript
- Vite 6
- Tailwind CSS
- Radix UI
- Lucide React Icons

### API 端点
- 基础地址：`http://192.168.8.179:8080`
- 接口格式：`GET /robot/{direction}/{speed}`
