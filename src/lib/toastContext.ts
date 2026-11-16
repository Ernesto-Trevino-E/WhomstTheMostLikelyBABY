import { createContext } from 'react'

export type ToastType = 'info' | 'error'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
}

export interface ToastApi {
  show: (message: string, type?: ToastType) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export const TOAST_DURATION_MS = 3000
