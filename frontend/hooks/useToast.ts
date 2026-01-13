import { useState, useCallback } from 'react'
import { ToastProps } from '@/components/ui/toast'

export interface Toast extends ToastProps {
  id: string
}

let toastIdCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastIdCounter}`
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    }

    setToasts((prev) => [...prev, newToast])

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback(
    (title: string, description?: string, duration?: number) => {
      return addToast({ title, description, variant: 'success', duration })
    },
    [addToast]
  )

  const error = useCallback(
    (title: string, description?: string, duration?: number) => {
      return addToast({ title, description, variant: 'error', duration: duration ?? 7000 })
    },
    [addToast]
  )

  const warning = useCallback(
    (title: string, description?: string, duration?: number) => {
      return addToast({ title, description, variant: 'warning', duration })
    },
    [addToast]
  )

  const info = useCallback(
    (title: string, description?: string, duration?: number) => {
      return addToast({ title, description, variant: 'info', duration })
    },
    [addToast]
  )

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}

