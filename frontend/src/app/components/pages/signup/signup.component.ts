import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { BrandIconComponent } from '../../shared/brand-icon/brand-icon.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BrandIconComponent],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  })
export class SignupComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  navScrolled = false;
  readonly year = new Date().getFullYear();

  isSubmitting = signal(false);
  generalError = signal('');
  successMessage = signal('');
  errors = signal<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});

  constructor(private authService: AuthService, private router: Router) { }

  @HostListener('window:scroll')
  onScroll() { this.navScrolled = window.scrollY > 40; }

  clearError(field: 'name' | 'email' | 'password' | 'confirmPassword') {
    this.errors.update(e => ({ ...e, [field]: undefined }));
  }

  onSubmit() {
    const errs: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};

    if (!this.name.trim()) errs.name = 'Full name is required';
    if (!this.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!this.password) {
      errs.password = 'Password is required';
    } else if (this.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    if (!this.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (this.password !== this.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errs).length > 0) {
      this.errors.set(errs);
      return;
    }

    this.isSubmitting.set(true);
    this.generalError.set('');
    this.errors.set({});

    this.authService.register(this.name, this.email, this.password).subscribe({
      next: () => {
        this.successMessage.set('Account created successfully! Redirecting...');
        this.isSubmitting.set(false);
        setTimeout(() => { this.router.navigate(['/dashboard']); }, 1500);
      },
      error: (err) => {
        if (err.status === 409) {
          this.errors.set({ email: err.message || 'This email is already registered' });
        } else {
          this.generalError.set(err?.message || 'Registration failed.');
        }
        this.isSubmitting.set(false);
      }
    });
  }
}
