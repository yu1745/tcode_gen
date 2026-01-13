import type { Device } from '@/interfaces/device'

export class DebugDevice implements Device {
  private logs: string[] = []
  private onLogCallback?: (logs: string[]) => void

  async connect(): Promise<void> {
    this.log('Debug Device Connected')
  }

  async disconnect(): Promise<void> {
    this.log('Debug Device Disconnected')
  }

  async send(command: string): Promise<void> {
    this.log(`Send: ${command}`)
  }

  isConnected(): boolean {
    return true
  }

  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString()
    this.logs.push(`[${timestamp}] ${message}`)
    console.log(`[${timestamp}] ${message}`)
    this.onLogCallback?.(this.logs)
  }

  getLogs(): string[] {
    return this.logs
  }

  clearLogs(): void {
    this.logs = []
    this.onLogCallback?.(this.logs)
  }

  onLog(callback: (logs: string[]) => void): void {
    this.onLogCallback = callback
  }
}
