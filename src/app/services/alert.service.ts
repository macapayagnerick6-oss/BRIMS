import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertResult } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AlertService {
  success(title: string, text?: string) {
    return Swal.fire({
      icon: 'success',
      title,
      text,
    });
  }

  /** Success message without OK button; closes automatically after timerMs (default 1000). */
  successToast(title: string, text?: string, timerMs: number = 1000) {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      showConfirmButton: false,
      timer: timerMs,
      timerProgressBar: true,
    });
  }

  error(title: string, text?: string) {
    return Swal.fire({
      icon: 'error',
      title,
      text,
    });
  }

  info(title: string, text?: string) {
    return Swal.fire({
      icon: 'info',
      title,
      text,
    });
  }

  warning(title: string, text?: string) {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
    });
  }

  confirm(options?: {
    title?: string;
    text?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    icon?: SweetAlertIcon;
  }): Promise<SweetAlertResult<any>> {
    return Swal.fire({
      title: options?.title ?? 'Are you sure?',
      text: options?.text ?? '',
      icon: options?.icon ?? 'question',
      showCancelButton: true,
      confirmButtonText: options?.confirmButtonText ?? 'Yes',
      cancelButtonText: options?.cancelButtonText ?? 'Cancel',
      reverseButtons: true,
      focusCancel: true,
    });
  }
}

