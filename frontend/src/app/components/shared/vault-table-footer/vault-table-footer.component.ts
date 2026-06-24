import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vault-table-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="vault-table-footer">
      @if (allowAdd) {
        <button type="button" class="btn-secondary btn-sm" [disabled]="!editMode" (click)="addRow.emit()">+ Add Row</button>
      }
      <div class="vault-table-footer-meta">
        @if (totalPages > 1) {
          <nav class="table-pagination" aria-label="Table pagination">
            <button type="button" class="page-btn" [disabled]="page <= 1" (click)="goPage(page - 1)">Previous</button>
            <span class="page-info">Page {{ page }} of {{ totalPages }}</span>
            <button type="button" class="page-btn" [disabled]="page >= totalPages" (click)="goPage(page + 1)">Next</button>
          </nav>
        }
        @if (totalItems > 0) {
          <span class="row-count">{{ totalItems }} row{{ totalItems === 1 ? '' : 's' }}</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .vault-table-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 0.85rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-light);
    }
    .vault-table-footer-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-left: auto;
    }
    .table-pagination {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .page-btn {
      padding: 0.35rem 0.65rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--surface);
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-family: inherit;
      cursor: pointer;
    }
    .page-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .page-btn:not(:disabled):hover { border-color: var(--accent-blue); color: var(--accent-blue); }
    .page-info, .row-count {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .btn-secondary.btn-sm {
      padding: 0.4rem 0.75rem;
      border: 1.5px solid var(--border-color);
      border-radius: 8px;
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
    }
    .btn-secondary.btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary.btn-sm:not(:disabled):hover {
      border-color: var(--accent-blue);
      color: var(--accent-blue);
    }
  `]
})
export class VaultTableFooterComponent {
  @Input() totalItems = 0;
  @Input() page = 1;
  @Input() pageSize = 8;
  @Input() editMode = false;
  @Input() allowAdd = true;

  @Output() pageChange = new EventEmitter<number>();
  @Output() addRow = new EventEmitter<void>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  goPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.pageChange.emit(p);
  }
}
