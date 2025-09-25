interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

export const toast: ToastApi = {
  success: (message: string) => {
    console.info('[toast:success]', message);
  },
  error: (message: string) => {
    console.error('[toast:error]', message);
  },
  info: (message: string) => {
    console.info('[toast:info]', message);
  },
};
