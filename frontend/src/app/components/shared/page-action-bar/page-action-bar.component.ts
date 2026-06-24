import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-action-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-action-bar">
      <button type="button" class="action-btn edit-btn" [class.active]="editing" (click)="editToggle.emit()">
        @if (!editing) {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            <path d="m15 5 4 4"/>
          </svg>
        }
        {{ editing ? 'Done editing' : 'Edit' }}
      </button>
      <button type="button" class="action-btn delete-btn" (click)="deleteAll.emit()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
        {{ deleteLabel }}
      </button>
    </div>
  `,
  styles: [`
    .page-action-bar {
      display: flex;
      justify-content: flex-end;
      gap: 0.625rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.9rem;
      border-radius: 9px;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s;
      border: 1.5px solid transparent;
    }
    .action-btn svg {
      width: 15px;
      height: 15px;
      flex-shrink: 0;
    }
    .edit-btn {
      background: rgba(59, 130, 246, 0.08);
      border-color: rgba(59, 130, 246, 0.2);
      color: #2563eb;
    }
    .edit-btn:hover, .edit-btn.active {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.35);
    }
    .edit-btn.active {
      background: #2563eb;
      color: #fff;
    }
    .delete-btn {
      background: rgba(239, 68, 68, 0.06);
      border-color: rgba(239, 68, 68, 0.18);
      color: #dc2626;
    }
    .delete-btn:hover {
      background: rgba(239, 68, 68, 0.12);
      border-color: rgba(239, 68, 68, 0.3);
    }
  `]
})
export class PageActionBarComponent {
  @Input() editing = false;
  @Input() deleteLabel = 'Delete all';
  @Output() editToggle = new EventEmitter<void>();
  @Output() deleteAll = new EventEmitter<void>();
}
