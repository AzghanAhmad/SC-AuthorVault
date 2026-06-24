import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, of, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenService } from './token.service';
import { WorkspaceLoaderService } from './workspace-loader.service';
import { getApiErrorMessage } from '../utils/api-error.util';

export interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly workspaceLoader = inject(WorkspaceLoaderService);

  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user() && this.tokenService.hasToken());
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
    if (stored && this.tokenService.hasToken()) {
      try {
        this._user.set(JSON.parse(stored));
      } catch { /* ignore */ }
    }
  }

  initialize(): Observable<boolean> {
    if (!this.tokenService.hasToken()) {
      this.clearSession();
      return of(false);
    }
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap(user => {
        this._user.set(user);
        localStorage.setItem('av_user', JSON.stringify(user));
        this.workspaceLoader.loadAll().subscribe();
      }),
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => this.applyAuth(res)),
      map(res => res.user),
      catchError(err => throwError(() => ({ message: getApiErrorMessage(err, 'Invalid email or password.') })))
    );
  }

  register(name: string, email: string, password: string): Observable<User> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, { name, email, password }).pipe(
      tap(res => this.applyAuth(res)),
      map(res => res.user),
      catchError(err => throwError(() => ({
        message: getApiErrorMessage(err, 'Registration failed.'),
        status: (err as { status?: number })?.status
      })))
    );
  }

  private applyAuth(res: AuthResponse): void {
    this.tokenService.set(res.token);
    this._user.set(res.user);
    localStorage.setItem('av_user', JSON.stringify(res.user));
    this.workspaceLoader.loadAll().subscribe();
  }

  clearSession(): void {
    this._user.set(null);
    this.tokenService.clear();
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

  changePassword(current: string, newPw: string): Observable<boolean> {
    return this.http.post<{ success: boolean }>(`${environment.apiUrl}/auth/change-password`, {
      currentPassword: current,
      newPassword: newPw
    }).pipe(
      map(() => true),
      catchError(err => throwError(() => err.error ?? { message: 'Password change failed' }))
    );
  }
}
