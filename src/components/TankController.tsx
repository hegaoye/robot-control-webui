// 履带车遥控器组件
// @version 1.1
// @date 2025-10-04
// @changelog 1.1: 滑块归零时使用 pause 代替 stop

import { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Gauge, Navigation, Power } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { sendChassisControl, setPowerStatus, setLogCallback } from '../api/robotApi';

type Direction = 'forward' | 'backward' | 'left' | 'right' | 'stop';

interface SpeedProgressBarProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function SpeedProgressBar({ value, onChange, disabled = false }: SpeedProgressBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const updateValue = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (disabled || !progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    let clientX: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    const offsetX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
    
    onChange(Math.round(percentage));
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    updateValue(e);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => updateValue(e);
    const handleTouchMove = (e: TouchEvent) => updateValue(e);
    const handleMouseUp = () => setIsDragging(false);
    const handleTouchEnd = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <div className="space-y-2">
      <div
        ref={progressRef}
        className={`relative h-3 bg-gray-600 rounded-full overflow-hidden ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div 
          className="absolute left-0 top-0 h-full bg-blue-400 transition-all rounded-full pointer-events-none"
          style={{ 
            width: `${value}%`,
            transitionDuration: isDragging ? '0ms' : '200ms'
          }}
        />
        {/* Draggable handle */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 border-2 border-blue-300 rounded-full shadow-lg pointer-events-none ${
            isDragging ? 'scale-125' : ''
          } transition-transform`}
          style={{ left: `calc(${value}% - 10px)` }}
        />
      </div>
      <div className="text-white text-center">
        {value}
      </div>
    </div>
  );
}

interface DragSliderProps {
  direction: 'vertical' | 'horizontal';
  onSpeedChange: (speed: number, direction: Direction) => void;
  maxSpeed: number;
  label: string;
  icons: {
    positive: React.ReactNode;
    negative: React.ReactNode;
  };
  disabled?: boolean;
}

function DragSlider({ direction, onSpeedChange, maxSpeed, label, icons, disabled = false }: DragSliderProps) {
  const [dragPosition, setDragPosition] = useState(0); // -1 to 1 (normalized)
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const isVertical = direction === 'vertical';

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    updatePosition(e);
  };

  const updatePosition = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!sliderRef.current || !handleRef.current) return;

    const sliderRect = sliderRef.current.getBoundingClientRect();
    const handleSize = isVertical ? handleRef.current.offsetHeight : handleRef.current.offsetWidth;
    
    let clientPos: number;

    if ('touches' in e) {
      clientPos = isVertical ? e.touches[0].clientY : e.touches[0].clientX;
    } else {
      clientPos = isVertical ? e.clientY : e.clientX;
    }

    const sliderSize = isVertical ? sliderRect.height : sliderRect.width;
    const sliderStart = isVertical ? sliderRect.top : sliderRect.left;
    
    // Calculate available movement space (slider size minus handle size)
    const availableSpace = sliderSize - handleSize;
    const center = sliderStart + sliderSize / 2;
    const offset = clientPos - center;
    const maxOffset = availableSpace / 2;

    // Calculate position (-1 to 1)
    let position = offset / maxOffset;
    position = Math.max(-1, Math.min(1, position));

    if (isVertical) {
      position = -position; // Invert for vertical (up is positive)
    }

    setDragPosition(position);

    // Calculate speed and direction
    const speed = Math.abs(position);
    const actualSpeed = speed * maxSpeed;

    let dir: Direction = 'stop';
    if (Math.abs(position) > 0.05) {
      if (isVertical) {
        dir = position > 0 ? 'forward' : 'backward';
      } else {
        dir = position > 0 ? 'right' : 'left';
      }
    }

    onSpeedChange(actualSpeed, dir);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    
    // Smooth return to center
    const animateReturn = () => {
      setDragPosition((prev) => {
        const step = prev * 0.8;
        if (Math.abs(step) < 0.01) {
          onSpeedChange(0, 'stop');
          return 0;
        }
        
        const speed = Math.abs(step);
        const actualSpeed = speed * maxSpeed;
        let dir: Direction = 'stop';
        
        if (Math.abs(step) > 0.05) {
          if (isVertical) {
            dir = step > 0 ? 'forward' : 'backward';
          } else {
            dir = step > 0 ? 'right' : 'left';
          }
        }
        
        onSpeedChange(actualSpeed, dir);
        requestAnimationFrame(animateReturn);
        return step;
      });
    };
    
    requestAnimationFrame(animateReturn);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => updatePosition(e);
    const handleTouchMove = (e: TouchEvent) => updatePosition(e);
    const handleMouseUp = () => handleDragEnd();
    const handleTouchEnd = () => handleDragEnd();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  // Calculate pixel offset for handle position
  const trackSize = isVertical ? 320 : 320; // h-80 or w-80 = 320px
  const handleSize = 64; // w-16 h-16 = 64px (圆形)
  const maxMovement = (trackSize - handleSize) / 2;
  const pixelOffset = dragPosition * maxMovement;
  
  // 判断当前激活的方向区域
  const isPositiveActive = dragPosition > 0.05;
  const isNegativeActive = dragPosition < -0.05;

  return (
    <div className="space-y-3">
      <h3 className="text-white text-center">{label}</h3>
      <div
        ref={sliderRef}
        className={`relative bg-slate-900/50 border-2 border-slate-700 rounded-full ${
          isVertical ? 'h-80 w-20' : 'w-80 h-20'
        } ${isDragging ? 'border-blue-500' : ''} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'} flex items-center justify-center overflow-hidden`}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        {/* Track indicators with highlight borders */}
        <div className={`absolute ${
          isVertical ? 'top-0 left-0 right-0 h-20' : 'left-0 top-0 bottom-0 w-20'
        } flex items-center justify-center pointer-events-none z-10 rounded-full transition-all ${
          isVertical ? (isPositiveActive ? 'border-2 border-blue-400 bg-blue-500/10' : '') : (isNegativeActive ? 'border-2 border-blue-400 bg-blue-500/10' : '')
        }`}>
          <div className={`${isVertical ? (isPositiveActive ? 'text-blue-400' : 'text-slate-500') : (isNegativeActive ? 'text-blue-400' : 'text-slate-500')} transition-colors`}>
            {isVertical ? icons.positive : icons.negative}
          </div>
        </div>
        <div className={`absolute ${
          isVertical ? 'bottom-0 left-0 right-0 h-20' : 'right-0 top-0 bottom-0 w-20'
        } flex items-center justify-center pointer-events-none z-10 rounded-full transition-all ${
          isVertical ? (isNegativeActive ? 'border-2 border-blue-400 bg-blue-500/10' : '') : (isPositiveActive ? 'border-2 border-blue-400 bg-blue-500/10' : '')
        }`}>
          <div className={`${isVertical ? (isNegativeActive ? 'text-blue-400' : 'text-slate-500') : (isPositiveActive ? 'text-blue-400' : 'text-slate-500')} transition-colors`}>
            {isVertical ? icons.negative : icons.positive}
          </div>
        </div>
        
        {/* Center line */}
        <div className={`absolute ${
          isVertical 
            ? 'top-1/2 left-0 right-0 h-0.5' 
            : 'left-1/2 top-0 bottom-0 w-0.5'
        } bg-slate-600 pointer-events-none`} />

        {/* Speed indicator bar - 和轨道一样宽，淡蓝色 */}
        {Math.abs(dragPosition) > 0.05 && (
          <div 
            className={`absolute pointer-events-none ${
              isVertical ? 'w-full left-0' : 'h-full top-0'
            } bg-blue-400/40`}
            style={
              isVertical
                ? dragPosition > 0
                  ? { bottom: '50%', height: `${Math.abs(pixelOffset)}px` }
                  : { top: '50%', height: `${Math.abs(pixelOffset)}px` }
                : dragPosition > 0
                  ? { left: '50%', width: `${Math.abs(pixelOffset)}px` }
                  : { right: '50%', width: `${Math.abs(pixelOffset)}px` }
            }
          />
        )}

        {/* Drag handle - 圆形 */}
        <div
          ref={handleRef}
          className={`absolute ${
            isDragging ? '' : 'transition-all duration-200'
          }`}
          style={
            isVertical
              ? { top: '50%', left: '50%', transform: `translate(-50%, calc(-50% + ${-pixelOffset}px))` }
              : { top: '50%', left: '50%', transform: `translate(calc(-50% + ${pixelOffset}px), -50%)` }
          }
        >
          <div className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-2 border-blue-400 shadow-lg ${
            isDragging ? 'shadow-blue-500/50 scale-110' : 'shadow-blue-500/30'
          } transition-all flex items-center justify-center`}>
            <div className="w-2 h-2 bg-blue-200 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TankController() {
  const [forwardBackSpeed, setForwardBackSpeed] = useState(0);
  const [leftRightSpeed, setLeftRightSpeed] = useState(0);
  const [forwardBackDir, setForwardBackDir] = useState<Direction>('stop');
  const [leftRightDir, setLeftRightDir] = useState<Direction>('stop');
  const [maxSpeed, setMaxSpeed] = useState<number>(50);
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // 节流控制：避免高频调用 API
  const lastApiCallTime = useRef(0);
  const API_THROTTLE_MS = 100; // 100ms 内最多调用一次
  
  // 设置日志回调
  useEffect(() => {
    setLogCallback((log: string) => {
      setLogs(prev => {
        const newLogs = [log, ...prev]; // 最新日志放在最前面
        // 最多保留 30 条日志
        if (newLogs.length > 30) {
          return newLogs.slice(0, 30);
        }
        return newLogs;
      });
    });
  }, []);

  // 发送控制命令到后端（带节流）
  const sendControlToApi = (direction: Direction, speed: number) => {
    const now = Date.now();
    if (now - lastApiCallTime.current < API_THROTTLE_MS) {
      return; // 跳过本次调用
    }
    lastApiCallTime.current = now;

    // 异步发送命令，不阻塞 UI
    sendChassisControl(direction, speed).catch(error => {
      console.error('发送控制命令失败:', error);
    });
  };

  const handleForwardBackChange = (speed: number, direction: Direction) => {
    setForwardBackSpeed(speed);
    setForwardBackDir(direction);
    
    // 发送控制命令到后端
    sendControlToApi(direction, speed);
  };

  const handleLeftRightChange = (speed: number, direction: Direction) => {
    setLeftRightSpeed(speed);
    setLeftRightDir(direction);
    
    // 发送控制命令到后端
    sendControlToApi(direction, speed);
  };

  const getCurrentDirection = (): Direction => {
    if (forwardBackDir !== 'stop') return forwardBackDir;
    if (leftRightDir !== 'stop') return leftRightDir;
    return 'stop';
  };

  const getCurrentSpeed = (): number => {
    return Math.max(forwardBackSpeed, leftRightSpeed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-7xl mx-auto bg-slate-800/90 border-slate-700 backdrop-blur">
        <div className="p-6 space-y-6">
        {/* 标题和电源开关 */}
        <div className="relative text-center">
          <h1 className="text-white">履带车遥控器</h1>
          
          {/* 电源开关 - 右上角 */}
          <div className="absolute right-0 top-0">
            <button
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isPowerOn 
                  ? 'bg-blue-500 hover:bg-blue-600 border-2 border-blue-400 shadow-blue-500/50' 
                  : 'bg-slate-700 hover:bg-slate-600 border-2 border-slate-600 shadow-slate-700/50'
              }`}
              onClick={async () => {
                const newPowerState = !isPowerOn;
                try {
                  await setPowerStatus(newPowerState);
                  setIsPowerOn(newPowerState);
                } catch (error) {
                  console.error('电源状态切换失败:', error);
                  // 可以在这里添加错误提示
                }
              }}
              title={isPowerOn ? '关机' : '开机'}
            >
              <Power className={`size-8 ${isPowerOn ? 'text-white' : 'text-slate-400'}`} />
            </button>
          </div>
        </div>

        {/* 状态显示 */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Navigation className="size-4" />
              <span>方向</span>
            </div>
            <Badge variant={getCurrentDirection() !== 'stop' ? "default" : "secondary"} className="text-lg px-3 py-1">
              {getCurrentDirection() === 'stop' ? '停止' : 
               getCurrentDirection() === 'forward' ? '前进' :
               getCurrentDirection() === 'backward' ? '后退' :
               getCurrentDirection() === 'left' ? '左转' : '右转'}
            </Badge>
          </div>
          
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Gauge className="size-4" />
              <span>当前速度</span>
            </div>
            <div className="text-white">
              {getCurrentSpeed().toFixed(0)} / {maxSpeed}
            </div>
          </div>
        </div>

        {/* 控制区域 */}
        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* 前进后退控制 */}
          <div className="flex justify-center">
            <DragSlider
              direction="vertical"
              onSpeedChange={handleForwardBackChange}
              maxSpeed={maxSpeed}
              label="前进 / 后退"
              icons={{
                positive: <ArrowUp className="size-5" />,
                negative: <ArrowDown className="size-5" />
              }}
              disabled={!isPowerOn}
            />
          </div>

          {/* 速度控制 */}
          <div className="space-y-4">
            <h3 className="text-white text-center">最大速度设置</h3>
            <div className="space-y-4">
              {/* 可拖拽进度条 */}
              <SpeedProgressBar value={maxSpeed} onChange={setMaxSpeed} disabled={!isPowerOn} />
              
              {/* 速度快捷按钮 */}
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  className={`${
                    maxSpeed === 30
                      ? 'bg-blue-600 hover:bg-blue-700 border-blue-500 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-white'
                  }`}
                  onClick={() => setMaxSpeed(30)}
                  disabled={!isPowerOn}
                >
                  30
                </Button>
                <Button
                  variant="outline"
                  className={`${
                    maxSpeed === 50
                      ? 'bg-blue-600 hover:bg-blue-700 border-blue-500 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-white'
                  }`}
                  onClick={() => setMaxSpeed(50)}
                  disabled={!isPowerOn}
                >
                  50
                </Button>
                <Button
                  variant="outline"
                  className={`${
                    maxSpeed === 70
                      ? 'bg-blue-600 hover:bg-blue-700 border-blue-500 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-white'
                  }`}
                  onClick={() => setMaxSpeed(70)}
                  disabled={!isPowerOn}
                >
                  70
                </Button>
                <Button
                  variant="outline"
                  className={`${
                    maxSpeed === 100
                      ? 'bg-blue-600 hover:bg-blue-700 border-blue-500 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-white'
                  }`}
                  onClick={() => setMaxSpeed(100)}
                  disabled={!isPowerOn}
                >
                  100
                </Button>
              </div>
            </div>
          </div>

          {/* 左右转控制 */}
          <div className="flex justify-center">
            <DragSlider
              direction="horizontal"
              onSpeedChange={handleLeftRightChange}
              maxSpeed={maxSpeed}
              label="左转 / 右转"
              icons={{
                negative: <ArrowLeft className="size-5" />,
                positive: <ArrowRight className="size-5" />
              }}
              disabled={!isPowerOn}
            />
          </div>
        </div>

        {/* 请求日志 */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white text-sm font-medium">请求日志</h3>
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white text-xs"
              onClick={() => setLogs([])}
            >
              清空日志
            </Button>
          </div>
          <div 
            ref={logContainerRef}
            className="bg-white border-2 border-slate-700 rounded-lg p-4 overflow-y-auto font-mono"
            style={{ minHeight: '500px', maxHeight: '1024px', fontSize: '16px' }}
          >
            {logs.length === 0 ? (
              <div className="text-gray-400 text-center py-4">暂无日志</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`mb-1 break-all ${index < 3 ? 'text-white' : 'text-slate-400'}`}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
        </div>
      </Card>
    </div>
  );
}
