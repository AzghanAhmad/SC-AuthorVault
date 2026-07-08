import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface VaultCreateOption {
  id: string;
  label: string;
}

export interface VaultCreateResult {
  name: string;
  parentId?: string;
}

@Component({
  selector: 'app-vault-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (open) {
      <div class="modal-overlay" (click)="onCancel()">
        <div class="modal-content vault-create-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button type="button" class="modal-close" (click)="onCancel()" aria-label="Close">✕</button>
          </div>
          <div class="modal-body">
            <p class="vault-create-hint">{{ hint }}</p>
            @if (parentLabel && parentOptions.length) {
              <div class="form-group">
                <span class="form-label">{{ parentLabel }}</span>
                <select class="form-input" [(ngModel)]="parentId">
                  @for (opt of parentOptions; track opt.id) {
                    <option [ngValue]="opt.id">{{ opt.label }}</option>
                  }
                </select>
              </div>
            }
            <div class="form-group">
              <span class="form-label">{{ nameLabel }}</span>
              <input
                class="form-input"
                type="text"
                [(ngModel)]="name"
                [placeholder]="placeholder"
                (keydown.enter)="onConfirm()"
              />
            </div>
            <p class="vault-create-note">{{ note }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" (click)="onCancel()">Cancel</button>
            <button type="button" class="btn-primary" [disabled]="!canConfirm" (click)="onConfirm()">
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: contents; }
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.5);
      backdrop-filter: blur(4px); z-index: 9999;
      display: flex; align-items: center; justify-content: center;
    }
    .modal-content {
      background: var(--surface); border: 1px solid var(--border-light);
      border-radius: 16px; padding: 1.5rem; box-shadow: var(--shadow-xl, 0 20px 50px rgba(0,0,0,.25));
      display: flex; flex-direction: column; gap: 1rem; max-height: 90vh; overflow-y: auto;
    }
    .vault-create-modal { width: 440px; max-width: 92vw; }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid var(--border-color); padding-bottom: .75rem;
    }
    .modal-title { font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .modal-close { background: none; border: none; font-size: 1.25rem; cursor: pointer; color: var(--text-muted); }
    .modal-body { display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: .75rem;
      border-top: 1px solid var(--border-color); padding-top: .75rem;
    }
    .vault-create-hint {
      margin: 0; font-size: .875rem; color: var(--text-secondary); line-height: 1.45;
    }
    .vault-create-note {
      margin: 0; font-size: .75rem; color: var(--text-muted); line-height: 1.4;
      padding: .65rem .75rem; background: var(--background);
      border: 1px dashed var(--border-color); border-radius: 8px;
    }
    .form-group { display: flex; flex-direction: column; gap: .35rem; }
    .form-label {
      font-size: .7rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: .04em; color: var(--text-muted);
    }
    .form-input {
      width: 100%; box-sizing: border-box;
      padding: .6rem .75rem; border: 1.5px solid var(--border-color);
      border-radius: 8px; background: var(--surface); color: var(--text-primary);
      font-size: .875rem; font-family: inherit;
    }
    .form-input:focus { outline: none; border-color: var(--accent-blue, #3b82f6); }
    .btn-primary, .btn-secondary {
      padding: .5rem 1.1rem; border-radius: 8px; font-size: .8125rem;
      font-weight: 600; font-family: inherit; cursor: pointer;
    }
    .btn-primary { background: var(--accent-blue, #3b82f6); color: #fff; border: none; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-secondary {
      background: var(--surface); color: var(--text-secondary);
      border: 1px solid var(--border-color);
    }
  `],
})
export class VaultCreateModalComponent implements OnChanges {
  @Input() open = false;
  @Input() title = 'Create';
  @Input() hint = 'Enter a name to continue. After you create it, the full details will open so you can fill everything in.';
  @Input() note = 'Tip: type the name first — all identity fields unlock on the next screen after you save.';
  @Input() nameLabel = 'Name';
  @Input() placeholder = 'Enter a name';
  @Input() confirmLabel = 'Create';
  @Input() parentLabel = '';
  @Input() parentOptions: VaultCreateOption[] = [];
  @Input() defaultName = '';
  @Input() defaultParentId = '';

  @Output() cancelled = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<VaultCreateResult>();

  name = '';
  parentId = '';

  get canConfirm(): boolean {
    if (!this.name.trim()) return false;
    if (this.parentLabel && this.parentOptions.length > 0 && !this.parentId) return false;
    return true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue) {
      this.name = this.defaultName || '';
      this.parentId = this.defaultParentId || this.parentOptions[0]?.id || '';
      setTimeout(() => {
        const el = document.querySelector('.vault-create-modal input.form-input') as HTMLInputElement | null;
        el?.focus();
        el?.select();
      }, 50);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onConfirm(): void {
    if (!this.canConfirm) return;
    this.confirmed.emit({
      name: this.name.trim(),
      parentId: this.parentId || undefined,
    });
  }
}
