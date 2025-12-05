/**
 * WebSocket 连接管理器
 * 支持自动重连、心跳检测和智能重连策略
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private protocols?: string | string[];

  // 重连相关
  private reconnectAttempts = 0;
  private maxReconnectAttempts = Infinity;
  private reconnectInterval = 1000; // 初始重连间隔 1 秒
  private maxReconnectInterval = 30000; // 最大重连间隔 30 秒
  private reconnectDecay = 1.5; // 重连间隔增长倍数
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // 心跳检测相关
  private heartbeatInterval = 30000; // 心跳间隔 30 秒
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private pongTimeout = 5000; // 等待 pong 响应的超时时间
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private missedHeartbeats = 0;
  private maxMissedHeartbeats = 3; // 最大允许丢失的心跳次数

  // 状态标记
  private shouldReconnect = true;
  private isManualClose = false;

  // 事件回调
  private onOpenCallback?: (event: Event) => void;
  private onMessageCallback?: (event: MessageEvent) => void;
  private onErrorCallback?: (event: Event) => void;
  private onCloseCallback?: (event: CloseEvent) => void;
  private onReconnectCallback?: (attempt: number) => void;

  constructor(
    url: string,
    protocols?: string | string[],
    options?: {
      maxReconnectAttempts?: number;
      reconnectInterval?: number;
      maxReconnectInterval?: number;
      reconnectDecay?: number;
      heartbeatInterval?: number;
      pongTimeout?: number;
      maxMissedHeartbeats?: number;
    }
  ) {
    this.url = url;
    this.protocols = protocols;

    if (options) {
      if (options.maxReconnectAttempts != null) {
        this.maxReconnectAttempts = options.maxReconnectAttempts;
      }
      if (options.reconnectInterval != null) {
        this.reconnectInterval = options.reconnectInterval;
      }
      if (options.maxReconnectInterval != null) {
        this.maxReconnectInterval = options.maxReconnectInterval;
      }
      if (options.reconnectDecay != null) {
        this.reconnectDecay = options.reconnectDecay;
      }
      if (options.heartbeatInterval != null) {
        this.heartbeatInterval = options.heartbeatInterval;
      }
      if (options.pongTimeout != null) {
        this.pongTimeout = options.pongTimeout;
      }
      if (options.maxMissedHeartbeats != null) {
        this.maxMissedHeartbeats = options.maxMissedHeartbeats;
      }
    }
  }

  /**
   * 连接 WebSocket
   */
  public connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket 已经连接');
      return;
    }

    this.isManualClose = false;
    this.shouldReconnect = true;

    try {
      this.ws = new WebSocket(this.url, this.protocols);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket 连接失败:', error);
      this.handleReconnect();
    }
  }

  /**
   * 关闭 WebSocket 连接
   */
  public close(code?: number, reason?: string): void {
    this.isManualClose = true;
    this.shouldReconnect = false;
    this.clearTimers();

    if (this.ws) {
      this.ws.close(code, reason);
      this.ws = null;
    }
  }

  /**
   * 发送消息
   */
  public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      console.error('WebSocket 未连接，无法发送消息');
    }
  }

  /**
   * 获取当前连接状态
   */
  public getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = (event: Event) => {
      console.log('WebSocket 连接成功');
      this.reconnectAttempts = 0;
      this.missedHeartbeats = 0;
      this.startHeartbeat();

      if (this.onOpenCallback) {
        this.onOpenCallback(event);
      }
    };

    this.ws.onmessage = (event: MessageEvent) => {
      // 检查是否是 pong 消息
      if (this.isPongMessage(event.data)) {
        this.handlePong();
        return;
      }

      if (this.onMessageCallback) {
        this.onMessageCallback(event);
      }
    };

    this.ws.onerror = (event: Event) => {
      console.error('WebSocket 错误:', event);

      if (this.onErrorCallback) {
        this.onErrorCallback(event);
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.log('WebSocket 连接关闭:', event.code, event.reason);
      this.clearTimers();

      if (this.onCloseCallback) {
        this.onCloseCallback(event);
      }

      if (!this.isManualClose && this.shouldReconnect) {
        this.handleReconnect();
      }
    };
  }

  /**
   * 开始心跳检测
   */
  private startHeartbeat(): void {
    this.clearHeartbeatTimer();

    this.heartbeatTimer = setTimeout(() => {
      this.sendPing();

      // 设置 pong 超时检测
      this.pongTimer = setTimeout(() => {
        this.missedHeartbeats++;
        console.warn(`未收到 pong 响应，丢失心跳次数: ${this.missedHeartbeats}`);

        if (this.missedHeartbeats >= this.maxMissedHeartbeats) {
          console.error('心跳检测失败，关闭连接并重连');
          this.ws?.close(1000, 'Heartbeat timeout');
        } else {
          this.startHeartbeat();
        }
      }, this.pongTimeout);
    }, this.heartbeatInterval);
  }

  /**
   * 发送 ping 消息
   */
  private sendPing(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      // 根据你的服务器协议发送 ping 消息
      // 这里使用 JSON 格式，你可以根据实际情况修改
      this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    }
  }

  /**
   * 判断是否是 pong 消息
   */
  private isPongMessage(data: any): boolean {
    try {
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        return parsed.type === 'pong';
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * 处理 pong 响应
   */
  private handlePong(): void {
    this.missedHeartbeats = 0;

    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }

    // 继续下一次心跳
    this.startHeartbeat();
  }

  /**
   * 处理重连
   */
  private handleReconnect(): void {
    if (!this.shouldReconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('已达到最大重连次数');
      return;
    }

    this.reconnectAttempts++;

    // 计算重连延迟时间（指数退避算法）
    const delay = Math.min(
      this.reconnectInterval * Math.pow(this.reconnectDecay, this.reconnectAttempts - 1),
      this.maxReconnectInterval
    );

    console.log(`第 ${this.reconnectAttempts} 次重连尝试，将在 ${delay}ms 后进行`);

    if (this.onReconnectCallback) {
      this.onReconnectCallback(this.reconnectAttempts);
    }

    this.reconnectTimer = setTimeout(() => {
      console.log('开始重连...');
      this.connect();
    }, delay);
  }

  /**
   * 清除所有定时器
   */
  private clearTimers(): void {
    this.clearHeartbeatTimer();
    this.clearReconnectTimer();
  }

  /**
   * 清除心跳定时器
   */
  private clearHeartbeatTimer(): void {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  /**
   * 清除重连定时器
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 设置事件回调
   */
  public onOpen(callback: (event: Event) => void): this {
    this.onOpenCallback = callback;
    return this;
  }

  public onMessage(callback: (event: MessageEvent) => void): this {
    this.onMessageCallback = callback;
    return this;
  }

  public onError(callback: (event: Event) => void): this {
    this.onErrorCallback = callback;
    return this;
  }

  public onClose(callback: (event: CloseEvent) => void): this {
    this.onCloseCallback = callback;
    return this;
  }

  public onReconnect(callback: (attempt: number) => void): this {
    this.onReconnectCallback = callback;
    return this;
  }
}