// Utility functions to replace alert() calls
// These will be replaced with toast notifications in components

let toastInstance: {
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
} | null = null

export function setToastInstance(instance: typeof toastInstance) {
  toastInstance = instance
}

export function toastSuccess(title: string, description?: string) {
  if (toastInstance) {
    toastInstance.success(title, description)
  } else {
    // Fallback to alert if toast not initialized
    alert(description ? `${title}\n${description}` : title)
  }
}

export function toastError(title: string, description?: string) {
  if (toastInstance) {
    toastInstance.error(title, description)
  } else {
    alert(description ? `${title}\n${description}` : title)
  }
}

export function toastWarning(title: string, description?: string) {
  if (toastInstance) {
    toastInstance.warning(title, description)
  } else {
    alert(description ? `${title}\n${description}` : title)
  }
}

export function toastInfo(title: string, description?: string) {
  if (toastInstance) {
    toastInstance.info(title, description)
  } else {
    alert(description ? `${title}\n${description}` : title)
  }
}


