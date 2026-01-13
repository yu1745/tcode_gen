import { useState, useEffect, useRef } from 'preact/hooks'
import type { Device } from '@/interfaces/device'
import { SerialDevice } from '@/devices/serial-device'
import { WebSocketDevice } from '@/devices/websocket-device'
import { BLEDevice } from '@/devices/ble-device'
import { DebugDevice } from '@/devices/debug-device'
import { WaveGenerator, type WaveGeneratorConfig } from '@/utils/wave-generator'
import { encodeTCode } from '@/utils/tcode-encoder'
import { useLocalStorageState } from '@/hooks/use-local-storage-state'

type DeviceType = 'serial' | 'websocket' | 'ble' | 'debug'

export function App() {
  const [deviceType, setDeviceType] = useState<DeviceType>('serial')
  const [isConnected, setIsConnected] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [showDebugDevice, setShowDebugDevice] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [wsUrl, setWsUrl] = useLocalStorageState('websocket_url', 'ws://localhost:8080')

  const [sendFrequency, setSendFrequency] = useLocalStorageState('send_frequency', 50)
  const [randomMin, setRandomMin] = useLocalStorageState('random_min', 0)
  const [randomMax, setRandomMax] = useLocalStorageState('random_max', 200)
  const [amplitudeMin, setAmplitudeMin] = useLocalStorageState('amplitude_min', 0)
  const [amplitudeMax, setAmplitudeMax] = useLocalStorageState('amplitude_max', 1)

  const deviceRef = useRef<Device | null>(null)
  const generatorRef = useRef<WaveGenerator | null>(null)
  const intervalRef = useRef<number | null>(null)

  const createDevice = (): Device => {
    switch (deviceType) {
      case 'serial':
        return new SerialDevice()
      case 'websocket':
        return new WebSocketDevice()
      case 'ble':
        return new BLEDevice()
      case 'debug':
        const debugDevice = new DebugDevice()
        debugDevice.onLog((logs) => setDebugLogs(logs))
        return debugDevice
    }
  }

  const handleConnect = async () => {
    try {
      const device = createDevice()
      await device.connect()
      deviceRef.current = device
      setIsConnected(true)
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      if (deviceRef.current) {
        await deviceRef.current.disconnect()
        deviceRef.current = null
      }
      setIsConnected(false)
      setIsRunning(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } catch (error) {
      console.error('Disconnect failed:', error)
    }
  }

  const toggleRunning = () => {
    setIsRunning(!isRunning)
  }

  useEffect(() => {
    if (isRunning && isConnected && deviceRef.current) {
      const config: WaveGeneratorConfig = {
        period: 0,
        randomMin,
        randomMax,
        amplitudeMin,
        amplitudeMax
      }
      const generator = new WaveGenerator(config)
      generatorRef.current = generator

      intervalRef.current = setInterval(() => {
        if (deviceRef.current && generatorRef.current) {
          const value = generatorRef.current.getNextValue()
          const tcode = encodeTCode(value)
          deviceRef.current!.send(tcode)
        }
      }, 1000 / sendFrequency)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, isConnected, sendFrequency, randomMin, randomMax, amplitudeMin, amplitudeMax])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const hasDevParam = urlParams.has('dev')
    setShowDebugDevice(hasDevParam)
    if (hasDevParam) {
      setDeviceType('debug')
    }
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">TCode Generator</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">连接设置</h2>

          <div className="mb-4">
            <label className="block mb-2">设备类型</label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType((e.currentTarget as HTMLSelectElement).value as DeviceType)}
              disabled={isConnected}
              className="w-full bg-gray-700 rounded px-3 py-2 disabled:opacity-50"
            >
              <option value="serial">串口</option>
              <option value="websocket">WebSocket</option>
              <option value="ble">蓝牙</option>
              {showDebugDevice && <option value="debug">Debug Device</option>}
            </select>
          </div>

          {deviceType === 'websocket' && (
            <div className="mb-4">
              <label className="block mb-2">WebSocket服务器地址</label>
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl((e.currentTarget as HTMLInputElement).value)}
                disabled={isConnected}
                placeholder="ws://localhost:8080"
                className="w-full bg-gray-700 rounded px-3 py-2 disabled:opacity-50"
              />
            </div>
          )}

          <button
            onClick={isConnected ? handleDisconnect : handleConnect}
            className={`w-full py-3 rounded-lg font-semibold ${isConnected
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
              }`}
          >
            {isConnected ? '断开连接' : '连接'}
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">波形参数</h2>

          <div className="mb-6">
            <label className="block mb-2">发送频率: {sendFrequency}Hz</label>
            <input
              type="range"
              min="1"
              max="200"
              value={sendFrequency}
              onChange={(e) => setSendFrequency(Number((e.currentTarget as HTMLInputElement).value))}
              className="w-full"
            />
          </div>


          <div className="mb-6">
            <label className="block mb-2">随机下界: {randomMin}ms</label>
            <input
              type="range"
              min="0"
              max="5000"
              value={randomMin}
              onChange={(e) => setRandomMin(Number((e.currentTarget as HTMLInputElement).value))}
              className="w-full"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2">随机上界: {randomMax}ms</label>
            <input
              type="range"
              min="0"
              max="5000"
              value={randomMax}
              onChange={(e) => setRandomMax(Number((e.currentTarget as HTMLInputElement).value))}
              className="w-full"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2">幅度最小值: {amplitudeMin.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={amplitudeMin}
              onChange={(e) => {
                const val = Number((e.currentTarget as HTMLInputElement).value)
                if (val <= amplitudeMax) {
                  setAmplitudeMin(val)
                }else{
                  setAmplitudeMin(amplitudeMax)
                }
              }}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">幅度最大值: {amplitudeMax.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={amplitudeMax}
              onChange={(e) => {
                const val = Number((e.currentTarget as HTMLInputElement).value)
                if (val >= amplitudeMin) {
                  setAmplitudeMax(val)
                }else{
                  setAmplitudeMax(amplitudeMin)
                }
              }}
              className="w-full"
            />
          </div>
        </div>

        <button
          onClick={toggleRunning}
          disabled={!isConnected}
          className={`w-full py-4 rounded-lg font-semibold text-lg ${isRunning
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRunning ? '停止' : '开始'}
        </button>

        {showDebugDevice && deviceType === 'debug' && (
          <div className="bg-gray-800 rounded-lg p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Debug Console</h2>
              <button
                onClick={() => {
                  if (deviceRef.current instanceof DebugDevice) {
                    (deviceRef.current as DebugDevice).clearLogs()
                  }
                }}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
              >
                Clear Logs
              </button>
            </div>
            <div className="bg-gray-950 rounded p-4 h-64 overflow-y-auto font-mono text-sm">
              {debugLogs.length === 0 ? (
                <p className="text-gray-500">No logs yet...</p>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index} className="mb-1 text-green-400">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}