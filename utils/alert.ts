import { useAlertStore, AlertButton } from '../store/useAlertStore';

export const CustomAlert = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    useAlertStore.getState().showAlert(title, message, buttons);
  }
};
