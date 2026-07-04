import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrandIconComponent } from '../brand-icon/brand-icon.component';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [RouterModule, BrandIconComponent],
  templateUrl: './public-footer.component.html',
  styleUrls: ['./public-footer.component.css'],
  })
export class PublicFooterComponent {
  readonly year = new Date().getFullYear();
}
