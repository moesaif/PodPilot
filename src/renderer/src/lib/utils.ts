import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function getStatusColor(status: string): string {
  const s = status.toLowerCase()
  if (s === 'running' || s === 'active' || s === 'ready' || s === 'true') return 'text-green-400'
  if (s === 'pending' || s === 'containercreating' || s === 'init:') return 'text-yellow-400'
  if (s === 'failed' || s === 'crashloopbackoff' || s === 'error' || s === 'oomkilled') return 'text-red-400'
  if (s === 'terminating' || s === 'notready') return 'text-orange-400'
  return 'text-slate-400'
}

export function getStatusDot(status: string): string {
  const s = status.toLowerCase()
  if (s === 'running' || s === 'active' || s === 'ready' || s === 'true') return 'bg-green'
  if (s === 'pending' || s === 'containercreating') return 'bg-yellow'
  if (s === 'failed' || s === 'crashloopbackoff' || s === 'error') return 'bg-red'
  if (s === 'terminating') return 'bg-orange'
  return 'bg-slate-500'
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'Ki', 'Mi', 'Gi', 'Ti']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function parseKubeMemory(mem: string): number {
  if (!mem) return 0
  if (mem.endsWith('Ki')) return parseInt(mem) * 1024
  if (mem.endsWith('Mi')) return parseInt(mem) * 1024 * 1024
  if (mem.endsWith('Gi')) return parseInt(mem) * 1024 * 1024 * 1024
  return parseInt(mem) || 0
}
