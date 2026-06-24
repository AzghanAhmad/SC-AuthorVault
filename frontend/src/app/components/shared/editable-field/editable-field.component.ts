import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-editable-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="form-group" [class.full]="full">
      <label class="form-label">{{ label }}</label>
      @if (readOnly) {
        <div class="form-value">
          @if (type === 'date') {
            {{ displayDate(value) }}
          } @else if (type === 'url' && value.trim()) {
            <a class="field-url-link" [href]="urlHref(value)" target="_blank" rel="noopener noreferrer">{{ displayUrl(value) }}</a>
          } @else {
            {{ value || '—' }}
          }
        </div>
      } @else if (type === 'textarea') {
        <textarea
          class="form-input vault-edit-input"
          [ngModel]="value"
          (ngModelChange)="onChange($event)"
          [rows]="rows"
          [placeholder]="placeholder || label"></textarea>
      } @else if (type === 'select') {
        <div class="field-select-field">
          <select
            class="form-input vault-edit-input field-select-input"
            [ngModel]="value"
            (ngModelChange)="onChange($event)">
            <option value="" disabled hidden>{{ placeholder || 'Select…' }}</option>
            @for (opt of selectOptions; track opt) {
              <option [value]="opt">{{ opt }}</option>
            }
          </select>
          <svg class="field-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      } @else if (type === 'date') {
        <input
          type="date"
          class="form-input vault-edit-input"
          [ngModel]="dateInputValue"
          (ngModelChange)="onChange($event)" />
      } @else {
        <input
          [type]="inputType"
          class="form-input vault-edit-input"
          [ngModel]="value"
          (ngModelChange)="onChange($event)"
          [placeholder]="resolvedPlaceholder" />
      }
      @if (type === 'email' && value.trim()) {
        <a class="sc-email-link" [href]="scEmailUrl(value)" target="_blank" rel="noopener noreferrer">
          Open in SC Email
        </a>
      }
    </div>
  `,
  styles: [`
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group.full { grid-column: 1 / -1; }
    .vault-edit-input {
      width: 100%;
      padding: 0.55rem 0.75rem;
      border: 1.5px solid var(--border-color);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text-primary);
      font-size: 0.875rem;
      font-family: inherit;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .vault-edit-input:focus {
      outline: none;
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
    }
    .sc-email-link, .field-url-link {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--accent-blue);
      text-decoration: none;
      word-break: break-all;
    }
    .sc-email-link:hover, .field-url-link:hover { text-decoration: underline; }
    .form-value {
      font-size: 0.875rem;
      color: var(--text-primary);
      padding: 0.55rem 0;
      min-height: 38px;
    }
    .field-select-field {
      position: relative;
      width: 100%;
    }
    .field-select-input {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      padding-right: 2rem;
      cursor: pointer;
    }
    .field-chevron {
      position: absolute;
      right: 0.6rem;
      top: 50%;
      transform: translateY(-50%);
      width: 14px;
      height: 14px;
      color: var(--accent-blue);
      pointer-events: none;
    }
  `]
})
export class EditableFieldComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() readOnly = false;
  @Input() type: 'text' | 'email' | 'url' | 'tel' | 'textarea' | 'select' | 'date' = 'text';
  @Input() full = false;
  @Input() rows = 3;
  @Input() placeholder = '';
  @Input() options: string[] = [];

  get selectOptions(): string[] {
    if (!this.value || this.options.includes(this.value)) return this.options;
    return [...this.options, this.value];
  }

  get resolvedPlaceholder(): string {
    if (this.placeholder) return this.placeholder;
    if (this.type === 'tel') return '+1 555 123 4567';
    return this.label;
  }

  get dateInputValue(): string {
    if (!this.value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(this.value)) return this.value;
    const parsed = new Date(this.value);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
    return '';
  }

  displayDate(value: string): string {
    if (!value) return '—';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return value;
  }

  @Output() valueChange = new EventEmitter<string>();

  get inputType(): string {
    if (this.type === 'email') return 'email';
    if (this.type === 'url') return 'url';
    if (this.type === 'tel') return 'tel';
    return 'text';
  }

  onChange(v: string): void {
    this.valueChange.emit(v);
  }

  scEmailUrl(email: string): string {
    return `https://mail.scribecount.com/compose?to=${encodeURIComponent(email.trim())}`;
  }

  urlHref(url: string): string {
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  displayUrl(url: string): string {
    return url.trim().replace(/^https?:\/\//i, '');
  }
}
