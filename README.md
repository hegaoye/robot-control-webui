# 四向运动控制页面

一个用于机器人“四向运动”（上/下/左/右）控制与状态展示的 Web 前端界面。基于 Vite + React 构建，集成了 Radix UI 组件等常用前端库，适合在本地开发或部署为静态站点。

- 在线设计稿（Figma）：https://www.figma.com/design/9CWuMf1AgUrdId4ho9rZHu/%E5%9B%9B%E5%90%91%E8%BF%90%E5%8A%A8%E6%8E%A7%E5%88%B6%E9%A1%B5%E9%9D%A2
- 构建工具：Vite
- 前端框架：React 18
- UI/辅助：Radix UI、lucide-react、react-hook-form、recharts 等

## 环境准备
- Node.js >= 18（建议使用 LTS 版本）
- npm >= 9（或使用 pnpm/yarn，命令请自行替换）

## 安装依赖与启动
1) 安装依赖
```
npm i
```
2) 启动开发服务器（默认自动打开浏览器）
```
npm run dev
# 或使用
npm start
```
开发地址：
- 本地默认端口：http://localhost:3000 （见 vite.config.ts 中 server.port 配置）

3) 生产构建
```
npm run build
```
构建产物会输出到 build 目录，可使用任意静态服务器托管（如 Nginx、Vercel、Netlify 等）。

- 本地预览生产构建（无需额外服务器）：
```
npm run preview
```

## 配置说明（重要）
所有开发时的服务器与代理配置均在 vite.config.ts 中：

- 开发服务器端口：
  - 位置：vite.config.ts -> server.port
  - 默认：3000
  - 如需修改端口，直接修改该值即可。

- 后端接口代理：
  - 位置：vite.config.ts -> server.proxy['/robot']
  - 默认目标：http://192.168.8.179:8080
  - 用途：当前端请求以 /robot 开头时，开发服务器会将请求代理到该后端地址。
  - 修改方法：将 target 改为你的后端服务地址（例如本机或其他局域网/云端 IP）。

- 自动打开浏览器：
  - 位置：vite.config.ts -> server.open
  - 默认：true（启动 dev 时自动打开浏览器）

> 提示：如果你的后端开启了 CORS 且你不想使用代理，也可以直接在前端请求真实后端域名；不过推荐在开发阶段使用 Vite 代理，避免跨域问题。

## 目录结构（简要）
- index.html：入口 HTML 文件
- src/：前端源码目录
  - api/：与后端交互的 API 封装
  - components/：通用组件
  - styles/：样式相关

## 常见问题
- 端口被占用：修改 vite.config.ts 的 server.port，或在启动前释放占用端口。
- 代理无效：确认访问的接口路径以 /robot 开头，检查 target 地址是否可达，是否与后端在同一网络。
- 浏览器未自动打开：将 vite.config.ts -> server.open 设为 true，或手动访问 http://localhost:3000。

如需进一步定制（例如环境变量、部署脚本、更多代理规则等），告诉我你的目标环境与约束，我可以为你补充对应配置与说明。
  