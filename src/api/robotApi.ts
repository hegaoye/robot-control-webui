// 底盘控制 API 接口
// @version 1.1
// @date 2025-10-04
// @changelog 1.1: 滑块归零时使用 pause 代替 stop

// 配置 API 基础 URL
// 使用空字符串，通过 Vite 代理转发到 http://192.168.8.179:8080
const API_BASE_URL = '';

// 日志回调函数类型
type LogCallback = (log: string) => void;
let logCallback: LogCallback | null = null;

// 设置日志回调
export function setLogCallback(callback: LogCallback) {
  logCallback = callback;
}

// 记录日志
function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  const logMessage = `[${timestamp}] ${message}`;
  if (logCallback) {
    logCallback(logMessage);
  }
}

// 页面方向类型
type PageDirection = 'forward' | 'backward' | 'left' | 'right' | 'stop';

// API 方向类型（根据 Swagger 文档）
type ApiDirection = 'forward' | 'reverse' | 'turn_left' | 'turn_right' | 'start' | 'pause' | 'stop';

// 方向映射：页面方向 -> API 方向
const directionMap: Record<PageDirection, ApiDirection> = {
  forward: 'forward',
  backward: 'reverse',
  left: 'turn_left',
  right: 'turn_right',
  stop: 'pause'  // 滑块归零时使用 pause
};

// 底盘控制命令接口
interface ChassisControlCommand {
  direction: ApiDirection;
  speed: number;
}

/**
 * 发送底盘控制命令
 * @param direction 页面方向（forward, backward, left, right, stop）
 * @param speed 速度 0-100
 */
export async function sendChassisControl(direction: PageDirection, speed: number): Promise<void> {
  try {
    const apiDirection = directionMap[direction];
    const apiSpeed = Math.max(0, Math.min(100, Math.round(speed))); // 确保速度在 0-100 范围内
    
    const url = `${API_BASE_URL}/robot/${apiDirection}/${apiSpeed}`;
    addLog(`📤 请求: GET ${url}`);
    console.log('发送底盘控制命令:', { direction: apiDirection, speed: apiSpeed });

    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorMsg = `底盘控制命令发送失败: ${response.statusText}`;
      addLog(`❌ 错误: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    addLog(`✅ 响应: ${JSON.stringify(data)}`);
    console.log('底盘控制响应:', data);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    addLog(`❌ 异常: ${errorMsg}`);
    console.error('发送底盘控制命令时出错:', error);
    throw error;
  }
}

/**
 * 设置电源状态（开始/停止）
 * @param isPowerOn true: 开始(start), false: 停止(stop)
 */
export async function setPowerStatus(isPowerOn: boolean): Promise<void> {
  try {
    const apiDirection = isPowerOn ? 'start' : 'stop';
    const apiSpeed = 0;
    
    const url = `${API_BASE_URL}/robot/${apiDirection}/${apiSpeed}`;
    addLog(`📤 请求: GET ${url} (${isPowerOn ? '开机' : '关机'})`);
    console.log('设置电源状态:', { direction: apiDirection, speed: apiSpeed });

    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorMsg = `电源状态设置失败: ${response.statusText}`;
      addLog(`❌ 错误: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    addLog(`✅ 响应: ${JSON.stringify(data)}`);
    console.log('电源状态响应:', data);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    addLog(`❌ 异常: ${errorMsg}`);
    console.error('设置电源状态时出错:', error);
    throw error;
  }
}
