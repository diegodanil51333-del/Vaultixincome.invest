export interface AppToast {
  id: string;
  type: 'success' | 'error' | 'info' | 'copy';
  title: string;
  message: string;
  duration?: number;
}

export function showToast(params: {
  type?: 'success' | 'error' | 'info' | 'copy';
  title?: string;
  message: string;
  duration?: number;
}) {
  const toast: AppToast = {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: params.type || 'info',
    title: params.title || (
      params.type === 'success' ? 'Success' :
      params.type === 'error' ? 'Error' :
      params.type === 'copy' ? 'Copied' : 'Notification'
    ),
    message: params.message,
    duration: params.duration || 3500
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vaultix_global_toast', { detail: toast }));
  }
}
