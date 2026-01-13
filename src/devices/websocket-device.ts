import { Device } from '@/interfaces/device';

export class WebSocketDevice implements Device {
  private ws: WebSocket | null = null;

  async connect(): Promise<void> {
    const url = localStorage.getItem('websocket_url');
    if (!url) {
      const inputUrl = prompt('请输入WebSocket服务器地址:');
      if (!inputUrl) {
        alert('WebSocket地址不能为空');
        throw new Error('WebSocket URL is required');
      }
      localStorage.setItem('websocket_url', inputUrl);
    }

    try {
      this.ws = new WebSocket(url || localStorage.getItem('websocket_url')!);

      return new Promise((resolve, reject) => {
        if (!this.ws) return reject(new Error('WebSocket creation failed'));

        this.ws.onopen = () => {
          resolve();
        };

        this.ws.onerror = (error) => {
          alert('WebSocket连接失败');
          reject(error);
        };

        this.ws.onclose = () => {
          this.ws = null;
        };
      });
    } catch (error) {
      alert('WebSocket连接失败: ' + (error as Error).message);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async send(command: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      alert('WebSocket未连接');
      throw new Error('WebSocket not connected');
    }
    this.ws.send(command);
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}