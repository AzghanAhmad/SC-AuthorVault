import { Component, input } from '@angular/core';

@Component({
  selector: 'app-brand-icon',
  standalone: true,
  template: `
    <span class="brand-icon" [class.sm]="size() === 'sm'">
      <img src="favicon_new.png" alt="ScribeCount" width="32" height="32" />
    </span>
  `,
  styles: [`
    .brand-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      border-radius: 10px;
      padding: 4px;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    .brand-icon.sm {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      padding: 3px;
    }

    .brand-icon img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
  `]
})
export class BrandIconComponent {
  size = input<'sm' | 'md'>('md');
}
