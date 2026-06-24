import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  VaultStatusKind,
  mergeStatusOptions,
  vaultStatusLabel,
} from '../../../utils/vault-status.util';

@Component({
  selector: 'app-status-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="status-select-wrap">
      @if (readOnly) {
        <span class="status-plain">{{ labelFor(value) || '—' }}</span>
      } @else {
        <div class="status-select-field">
          <select
            class="form-input status-select-input"
            [ngModel]="value"
            (ngModelChange)="onChange($event)"
            [disabled]="disabled">
            @for (opt of resolvedOptions; track opt) {
              <option [value]="opt">{{ labelFor(opt) }}</option>
            }
          </select>
          <svg class="status-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      }
    </div>
  `,
  styles: [`
    .status-select-wrap { width: 100%; }
    .status-select-field {
      position: relative;
      width: 100%;
    }
    .status-select-input {
      min-width: 130px;
      width: 100%;
      padding: 0.45rem 2rem 0.45rem 0.6rem;
      font-size: 0.8125rem;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background: var(--surface);
      border: 1.5px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      cursor: pointer;
    }
    .status-select-input:focus {
      outline: none;
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
    }
    .status-chevron {
      position: absolute;
      right: 0.55rem;
      top: 50%;
      transform: translateY(-50%);
      width: 14px;
      height: 14px;
      color: var(--accent-blue);
      pointer-events: none;
    }
    .status-plain {
      font-size: 0.875rem;
      color: var(--text-primary);
      font-weight: 500;
    }
  `],
})
export class StatusSelectComponent {
  @Input() kind: VaultStatusKind = 'company';
  @Input() value = '';
  @Input() readOnly = false;
  @Input() disabled = false;
  @Input() options: string[] | null = null;

  @Output() valueChange = new EventEmitter<string>();

  get resolvedOptions(): string[] {
    return this.options ?? mergeStatusOptions(this.kind, this.value);
  }

  labelFor(status: string): string {
    return vaultStatusLabel(status);
  }

  onChange(v: string): void {
    this.valueChange.emit(v);
  }
}
