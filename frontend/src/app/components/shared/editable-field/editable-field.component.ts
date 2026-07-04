import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-editable-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editable-field.component.html',
  styleUrls: ['./editable-field.component.css'],
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
