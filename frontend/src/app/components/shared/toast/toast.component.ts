import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type" (click)="toastService.dismiss(toast.id)">
          <svg *ngIf="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <svg *ngIf="toast.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <svg *ngIf="toast.type === 'info'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      display: flex;
      flex-direction: column-reverse;
      gap: 0.5rem;
      z-index: 10000;
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.25rem;
      background: rgb(28,46,74);
      color: white;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
      box-shadow: 0 12px 32px rgba(0,0,0,0.2);
      animation: toastIn 0.35s cubic-bezier(0.4,0,0.2,1);
      cursor: pointer;
      max-width: 380px;
    }

    .toast svg { width: 18px; height: 18px; flex-shrink: 0; }
    .toast-success svg { color: #6ee7b7; }
    .toast-error { background: #dc2626; }
    .toast-error svg { color: #fecaca; }
    .toast-info svg { color: #93c5fd; }

    @keyframes toastIn {
      from { opacity:0; transform:translateY(16px) scale(0.95); }
      to { opacity:1; transform:translateY(0) scale(1); }
    }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
