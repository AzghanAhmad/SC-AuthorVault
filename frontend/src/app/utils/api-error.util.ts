import { HttpErrorResponse } from '@angular/common/http';

export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object' && typeof body.message === 'string' && body.message.trim()) {
      return body.message;
    }
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (err.status === 401) return 'Invalid email or password.';
    if (err.status === 404) return 'Account not found.';
    if (err.status === 409) return 'An account with this email already exists.';
    if (err.status === 400) return 'Please check your details and try again.';
    if (err.status === 0) return 'Unable to reach the server. Make sure the API is running.';
  }

  if (err && typeof err === 'object') {
    const e = err as { message?: string; error?: { message?: string } };
    if (e.error?.message) return e.error.message;
    if (e.message && !e.message.startsWith('Http failure response')) return e.message;
  }

  return fallback;
}
