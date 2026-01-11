'use client'

import { createContext, useContext, ReactNode, useEffect } from 'react'
import { useToast as useToastHook, Toast } from '@/hooks/useToast'
import { Toast as ToastComponent } from '@/components/ui/toast'
import { setToastInstance } from '@/lib/toast'

const ToastContext = createContext<ReturnType<typeof useToastHook> | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useToastHook()

  useEffect(() => {
    setToastInstance(toast)
  }, [toast])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-[calc(100vw-2rem)]">
        {toast.toasts.map((toastItem) => (
          <div 
            key={toastItem.id} 
            className="pointer-events-auto transform transition-all duration-300 ease-out"
          >
            <ToastComponent
              {...toastItem}
              onClose={() => toast.removeToast(toastItem.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

