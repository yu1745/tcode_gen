import { Device } from '@/interfaces/device';

export class BLEDevice implements Device {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private readonly SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
  private readonly CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

  async connect(): Promise<void> {
    const nav = navigator as any;
    if (!('bluetooth' in nav)) {
      alert('您的浏览器不支持Web Bluetooth API，请使用Chrome或Edge浏览器');
      throw new Error('Web Bluetooth API not supported');
    }

    try {
      this.device = await nav.bluetooth.requestDevice({
        filters: [{ services: [this.SERVICE_UUID] }]
      });
      if (!this.device) {
        throw new Error('Failed to request device');
      }
      const gatt = this.device.gatt;
      if (!gatt) {
        throw new Error('GATT server not available');
      }

      const server = await gatt.connect();
      const service = await server.getPrimaryService(this.SERVICE_UUID);
      this.characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID);

      this.device.addEventListener('gattserverdisconnected', () => {
        this.device = null;
        this.characteristic = null;
      });
    } catch (error) {
      alert('蓝牙连接失败: ' + (error as Error).message);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
      this.device = null;
      this.characteristic = null;
    }
  }

  async send(command: string): Promise<void> {
    if (!this.characteristic) {
      alert('蓝牙设备未连接');
      throw new Error('BLE device not connected');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(command);
    await this.characteristic.writeValue(data);
  }

  isConnected(): boolean {
    return this.device !== null && this.characteristic !== null;
  }
}