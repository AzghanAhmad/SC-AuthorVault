import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly KEY = 'av_token';

  get(): string | null {
    return localStorage.getItem(this.KEY);
  }

  set(token: string): void {
    localStorage.setItem(this.KEY, token);
  }

  clear(): void {
    localStorage.removeItem(this.KEY);
  }

  hasToken(): boolean {
    return !!this.get();
  }
}
