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
      default: "bg-white border border-gray-200 text-gray-900 shadow-xl",
      success: "bg-white border-l-4 border-green-500 text-gray-900 shadow-xl",
      error: "bg-white border-l-4 border-red-500 text-gray-900 shadow-xl",
      warning: "bg-white border-l-4 border-yellow-500 text-gray-900 shadow-xl",
      info: "bg-white border-l-4 border-blue-500 text-gray-900 shadow-xl",
    }

    const iconStyles = {
      default: "text-gray-600",
      success: "text-green-500",
      error: "text-red-500",
      warning: "text-yellow-500",
      info: "text-blue-500",
    }

    const icons = {
      default: null,
      success: (
        <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center ${iconStyles.success}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ),
      error: (
        <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center ${iconStyles.error}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      ),
      warning: (
        <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center ${iconStyles.warning}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      ),
      info: (
        <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center ${iconStyles.info}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start gap-4 rounded-lg p-4 min-w-[320px] max-w-[420px] backdrop-blur-sm",
          "transform transition-all duration-300 ease-out animate-in slide-in-from-right-5 fade-in-0",
          "hover:shadow-2xl hover:scale-[1.02]",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {icons[variant] && icons[variant]}
        <div className="flex-1 min-w-0">
          {title && <div className="font-semibold text-sm mb-1.5 text-gray-900">{title}</div>}
          {description && <div className="text-sm text-gray-600 leading-relaxed">{description}</div>}
        </div>
        <button
          onClick={props.onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 -mt-1 -mr-1 rounded hover:bg-gray-100"
          aria-label="Fermer"
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


