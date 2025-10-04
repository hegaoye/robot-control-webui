# 接口对接示例

## 方式一：在 TankController 组件中集成 API

修改 `src/components/TankController.tsx`，添加 API 调用：

```typescript
import { sendControlCommand, setPowerStatus, setMaxSpeed } from '../api/robotApi';

export function TankController() {
  // ... 现有的 state

  // 1. 电源开关对接接口
  const handlePowerToggle = async () => {
    const newPowerState = !isPowerOn;
    try {
      await setPowerStatus(newPowerState);
      setIsPowerOn(newPowerState);
    } catch (error) {
      console.error('电源状态切换失败:', error);
      // 可以显示错误提示
    }
  };

  // 2. 方向控制对接接口
  const handleForwardBackChange = async (speed: number, direction: Direction) => {
    setForwardBackSpeed(speed);
    setForwardBackDir(direction);
    
    // 发送控制命令到后端
    try {
      await sendControlCommand({
        direction,
        speed,
        maxSpeed
      });
    } catch (error) {
      console.error('发送控制命令失败:', error);
    }
  };

  const handleLeftRightChange = async (speed: number, direction: Direction) => {
    setLeftRightSpeed(speed);
    setLeftRightDir(direction);
    
    // 发送控制命令到后端
    try {
      await sendControlCommand({
        direction,
        speed,
        maxSpeed
      });
    } catch (error) {
      console.error('发送控制命令失败:', error);
    }
  };

  // 3. 速度设置对接接口（使用防抖）
  const handleMaxSpeedChange = async (newMaxSpeed: number) => {
    setMaxSpeed(newMaxSpeed);
    
    // 使用防抖避免频繁调用
    clearTimeout(speedDebounceTimer);
    speedDebounceTimer = setTimeout(async () => {
      try {
        await setMaxSpeed(newMaxSpeed);
      } catch (error) {
        console.error('设置最大速度失败:', error);
      }
    }, 500);
  };

  // 在按钮的 onClick 中使用 handlePowerToggle
  // <button onClick={handlePowerToggle}>
}
```

## 方式二：使用 WebSocket 实时通信（推荐用于实时控制）

创建 `src/api/robotWebSocket.ts`：

```typescript
type MessageHandler = (data: any) => void;

class RobotWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private messageHandlers: MessageHandler[] = [];

  constructor(url: string = 'ws://localhost:8080/ws') {
    this.url = url;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket 连接已建立');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.messageHandlers.forEach(handler => handler(data));
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket 连接已关闭');
      // 自动重连
      setTimeout(() => this.connect(), 3000);
    };
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

export const robotWS = new RobotWebSocket();
```

在组件中使用 WebSocket：

```typescript
useEffect(() => {
  // 连接 WebSocket
  robotWS.connect();

  // 监听消息
  robotWS.onMessage((data) => {
    console.log('收到服务器消息:', data);
    // 更新状态
  });

  return () => {
    robotWS.disconnect();
  };
}, []);

// 发送控制命令
const handleControl = (direction: Direction, speed: number) => {
  robotWS.send({
    type: 'control',
    direction,
    speed,
    maxSpeed
  });
};
```

## 方式三：使用节流/防抖优化高频调用

对于滑块这种高频触发的控制，建议使用节流：

```typescript
import { useEffect, useRef } from 'react';

function useThrottle(callback: Function, delay: number) {
  const lastRun = useRef(Date.now());

  return (...args: any[]) => {
    const now = Date.now();
    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    }
  };
}

// 在组件中使用
const throttledSendCommand = useThrottle((direction: Direction, speed: number) => {
  sendControlCommand({ direction, speed, maxSpeed });
}, 100); // 每 100ms 最多发送一次

const handleForwardBackChange = (speed: number, direction: Direction) => {
  setForwardBackSpeed(speed);
  setForwardBackDir(direction);
  throttledSendCommand(direction, speed);
};
```

## 配置环境变量

创建 `.env` 文件：

```env
VITE_API_URL=http://192.168.1.100:8080/api
VITE_WS_URL=ws://192.168.1.100:8080/ws
```

## 后端接口示例（参考）

后端需要提供以下接口：

```
POST /api/power          - 设置电源状态
POST /api/control        - 发送控制命令
POST /api/max-speed      - 设置最大速度
GET  /api/status         - 获取机器人状态
WS   /ws                 - WebSocket 实时通信
```

请求体示例：

```json
// 控制命令
{
  "direction": "forward",
  "speed": 75,
  "maxSpeed": 100
}

// 电源状态
{
  "isPowerOn": true
}
```
