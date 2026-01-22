import Swal from 'sweetalert2';

export const themeConfig = {
  background: '#0f172a', // Slate 900
  color: '#ffffff',
  confirmButtonColor: '#FACC15', // Primary Yellow
  cancelButtonColor: '#1e293b', // Slate 800
  buttonsStyling: true,
  customClass: {
    popup: 'rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl',
    title: 'text-2xl font-black italic uppercase tracking-tighter',
    confirmButton: 'rounded-xl px-8 py-3 font-black underline italic uppercase tracking-tighter text-black bg-primary',
    cancelButton: 'rounded-xl px-8 py-3 font-bold uppercase tracking-tight bg-slate-800'
  }
};

export const showAlert = {
  success: (message: string, title: string = 'Success!') => {
    return Swal.fire({
      ...themeConfig,
      icon: 'success',
      title,
      text: message,
    });
  },

  error: (message: string, title: string = 'Error') => {
    return Swal.fire({
      ...themeConfig,
      icon: 'error',
      title,
      text: message,
      confirmButtonColor: '#ef4444', // Red for errors
    });
  },

  warning: (message: string, title: string = 'Warning') => {
    return Swal.fire({
      ...themeConfig,
      icon: 'warning',
      title,
      text: message,
    });
  },

  info: (message: string, title: string = 'Information') => {
    return Swal.fire({
      ...themeConfig,
      icon: 'info',
      title,
      text: message,
      confirmButtonColor: '#3b82f6', // Blue for info
    });
  },

  confirm: async (message: string, title: string = 'Are you sure?') => {
    const result = await Swal.fire({
      ...themeConfig,
      icon: 'question',
      title,
      text: message,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    });
    return result.isConfirmed;
  }
};
