// Socket.IO client integration for Next.js frontend

export { SocketProvider, useSocket } from './SocketProvider'
export {
  useMetrics,
  useCPUMetrics,
  useMemoryMetrics,
  useNetworkMetrics,
  useDiskMetrics,
  useLoadMetrics,
  useTemperatureMetrics
} from './useMetrics'
export {
  useAlerts,
  useServers,
  useAppMetrics,
  useResponseTimeMetrics,
  useErrorRateMetrics,
  useUptimeMetrics,
  useConnectionMetrics
} from './useAppMetrics'