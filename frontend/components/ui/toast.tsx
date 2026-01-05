import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "success" | "error" | "warning" | "info"
  duration?: number
  onClose?: () => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps & React.HTMLAttributes<HTMLDivElement>>(
  ({ className, title, description, variant = "default", ...props }, ref) => {
    const variantStyles = {
      default: "bg-gray-900 text-white",
      success: "bg-green-600 text-white",
      error: "bg-red-600 text-white",
      warning: "bg-yellow-500 text-white",
      info: "bg-blue-600 text-white",
    }

    const icons = {
      default: null,
      success: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      error: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      warning: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      info: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start gap-3 rounded-lg shadow-lg p-4 min-w-[300px] max-w-[500px] animate-in slide-in-from-top-5",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {icons[variant] && <div className="flex-shrink-0 mt-0.5">{icons[variant]}</div>}
        <div className="flex-1">
          {title && <div className="font-semibold text-sm mb-1">{title}</div>}
          {description && <div className="text-sm opacity-90">{description}</div>}
        </div>
        <button
          onClick={props.onClose}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }
)
Toast.displayName = "Toast"

export { Toast }


