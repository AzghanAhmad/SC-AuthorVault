import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';

interface User {
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly displayName = computed(() => this._user()?.name || 'User');
  readonly email = computed(() => this._user()?.email || '');
  readonly initials = computed(() => {
    const n = this._user()?.name || 'U';
    const parts = n.split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : n.substring(0, 2).toUpperCase();
  });

  constructor() {
    const stored = localStorage.getItem('av_user');
    if (stored) {
      try { this._user.set(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }

  login(email: string, password: string): Observable<User> {
    if (password.length < 3) {
      return throwError(() => ({ message: 'Invalid credentials' }));
    }
    const user: User = { name: email.split('@')[0], email };
    this._user.set(user);
    localStorage.setItem('av_user', JSON.stringify(user));
    return of(user).pipe(delay(800));
  }

  register(name: string, email: string, _password: string): Observable<User> {
    const user: User = { name, email };
    this._user.set(user);
    localStorage.setItem('av_user', JSON.stringify(user));
    return of(user).pipe(delay(1000));
  }

  clearSession(): void {
    this._user.set(null);
    localStorage.removeItem('av_user');
  }

  updateCachedUser(partial: Partial<User>): void {
    const current = this._user();
    if (current) {
      const updated = { ...current, ...partial };
      this._user.set(updated);
      localStorage.setItem('av_user', JSON.stringify(updated));
    }
  }

  changePassword(_current: string, _newPw: string): Observable<boolean> {
    return of(true).pipe(delay(600));
  }
}
