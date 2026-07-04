import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { BrandIconComponent } from '../../shared/brand-icon/brand-icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BrandIconComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  })
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  navScrolled = false;
  readonly year = new Date().getFullYear();

  isSubmitting = signal(false);
  generalError = signal('');
  errors = signal<{ email?: string; password?: string }>({});

  constructor(private authService: AuthService, private router: Router) { }

  @HostListener('window:scroll')
  onScroll() { this.navScrolled = window.scrollY > 40; }

  clearError(field: 'email' | 'password') {
    this.errors.update(e => ({ ...e, [field]: undefined }));
  }

  onSubmit() {
    const errs: { email?: string; password?: string } = {};

    if (!this.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!this.password) {
      errs.password = 'Password is required';
    }

    if (Object.keys(errs).length > 0) {
      this.errors.set(errs);
      return;
    }

    this.isSubmitting.set(true);
    this.generalError.set('');
    this.errors.set({});

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.generalError.set(err?.message || 'Invalid email or password.');
        this.isSubmitting.set(false);
      }
    });
  }
}
