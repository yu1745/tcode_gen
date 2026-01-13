import { Device } from '@/interfaces/device';

export class SerialDevice implements Device {
  private port: SerialPort | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

  async connect(): Promise<void> {
    if (!('serial' in navigator)) {
      alert('您的浏览器不支持Web Serial API，请使用Chrome或Edge浏览器');
      throw new Error('Web Serial API not supported');
    }

    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 9600 });

      const encoder = new TextEncoderStream();
      const writableStreamClosed = encoder.readable.pipeTo(this.port.writable);
      this.writer = encoder.writable.getWriter();
    } catch (error) {
      alert('串口连接失败: ' + (error as Error).message);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.writer) {
        await this.writer.close();
        this.writer = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch (error) {
      alert('串口断开失败: ' + (error as Error).message);
      throw error;
    }
  }

  async send(command: string): Promise<void> {
    if (!this.writer) {
      throw new Error('Serial device not connected');
    }
    await this.writer.write(command);
  }

  isConnected(): boolean {
    return this.port !== null && this.writer !== null;
  }
}