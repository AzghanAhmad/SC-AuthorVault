import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrandIconComponent } from '../brand-icon/brand-icon.component';

@Component({
  selector: 'app-public-nav',
  standalone: true,
  imports: [RouterModule, BrandIconComponent],
  templateUrl: './public-nav.component.html',
  styleUrls: ['./public-nav.component.css'],
  })
export class PublicNavComponent {
  navScrolled = false;

  @HostListener('window:scroll')
  onScroll() { this.navScrolled = window.scrollY > 40; }
}
