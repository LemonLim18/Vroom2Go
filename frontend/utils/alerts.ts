import Swal from 'sweetalert2';

export const showAlert = {
  success: (message: string, title: string = 'Success!') => {
    return Swal.fire({
      icon: 'success',
      title,
      text: message,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'OK'
    });
  },

  error: (message: string, title: string = 'Error') => {
    return Swal.fire({
      icon: 'error',
      title,
      text: message,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'OK'
    });
  },

  warning: (message: string, title: string = 'Warning') => {
    return Swal.fire({
      icon: 'warning',
      title,
      text: message,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'OK'
    });
  },

  info: (message: string, title: string = 'Information') => {
    return Swal.fire({
      icon: 'info',
      title,
      text: message,
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'OK'
    });
  },

  confirm: async (message: string, title: string = 'Are you sure?') => {
    const result = await Swal.fire({
      icon: 'question',
      title,
      text: message,
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    });
    return result.isConfirmed;
  }
};
