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
      @if (type === 'textarea') {
        <textarea
          class="form-input vault-edit-input"
          [ngModel]="value"
          (ngModelChange)="onChange($event)"
          [rows]="rows"
          [placeholder]="placeholder || label"></textarea>
      } @else {
        <input
          [type]="inputType"
          class="form-input vault-edit-input"
          [ngModel]="value"
          (ngModelChange)="onChange($event)"
          [placeholder]="placeholder || label" />
      }
      @if (type === 'email' && value?.trim()) {
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
    .sc-email-link {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--accent-blue);
      text-decoration: none;
      margin-top: 0.15rem;
    }
    .sc-email-link:hover { text-decoration: underline; }
  `]
})
export class EditableFieldComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() type: 'text' | 'email' | 'url' | 'tel' | 'textarea' = 'text';
  @Input() full = false;
  @Input() rows = 3;
  @Input() placeholder = '';

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
}
