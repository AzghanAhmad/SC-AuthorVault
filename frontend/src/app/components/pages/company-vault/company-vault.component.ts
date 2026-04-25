import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CompanyVaultService } from '../../../services/company-vault.service';
import { ToastService } from '../../../services/toast.service';
import { CompanyVault } from '../../../models/company-vault.model';

type SectionId = 'overview' | 'profile' | 'operations' | 'financials' | 'records' | 'system';

@Component({
  selector: 'app-company-vault',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './company-vault.component.html',
  styleUrl: './company-vault.component.css'
})
export class CompanyVaultComponent implements OnInit {
  private vaultService = inject(CompanyVaultService);
  private toast = inject(ToastService);

  vault = signal<CompanyVault | null>(null);
  loading = signal(true);
  activeSection = signal<SectionId>('overview');

  // Sub-tabs per section
  profileTab = signal<'identity' | 'ownership' | 'domains' | 'branding'>('identity');
  opsTab = signal<'platforms' | 'team' | 'inventory' | 'email'>('platforms');
  finTab = signal<'banking' | 'tax' | 'reports'>('banking');
  recTab = signal<'contracts' | 'legal' | 'isbns' | 'templates'>('contracts');
  sysTab = signal<'access' | 'recovery' | 'calendar'>('access');

  sections = [
    { id: 'overview' as SectionId, label: 'Overview', icon: 'grid' },
    { id: 'profile' as SectionId, label: 'Company Profile', icon: 'building' },
    { id: 'operations' as SectionId, label: 'Operations', icon: 'cog' },
    { id: 'financials' as SectionId, label: 'Financials', icon: 'dollar' },
    { id: 'records' as SectionId, label: 'Assets & Records', icon: 'folder' },
    { id: 'system' as SectionId, label: 'System & Security', icon: 'shield' },
  ];

  ngOnInit() {
    this.vaultService.getCompanyVault().subscribe(v => {
      this.vault.set(v);
      this.loading.set(false);
    });
  }

  alertIcon(type: string): string {
    const m: Record<string, string> = { tax: '💰', domain: '🌐', contract: '📄', general: 'ℹ️' };
    return m[type] || 'ℹ️';
  }

  severityClass(s: string): string {
    return s === 'urgent' ? 'badge-rejected' : s === 'warning' ? 'badge-draft' : 'badge-pending';
  }

  sslClass(s: string): string {
    return s === 'active' ? 'status-green' : s === 'expiring' ? 'status-yellow' : 'status-red';
  }

  platformColor(i: number): string {
    const g = [
      'linear-gradient(135deg,#ff9900,#e47911)',
      'linear-gradient(135deg,#c9232d,#a01b24)',
      'linear-gradient(135deg,#555,#333)',
      'linear-gradient(135deg,#2a6d3c,#1e5430)',
      'linear-gradient(135deg,#f97316,#dc2626)',
    ];
    return g[i % g.length];
  }

  dateTypeClass(t: string): string {
    const m: Record<string, string> = { tax: 'badge-rejected', renewal: 'badge-draft', launch: 'badge-approved', contract: 'badge-pending', other: 'badge-published' };
    return m[t] || 'badge-published';
  }

  isbnStats() {
    const v = this.vault();
    if (!v) return { total: 0, assigned: 0, available: 0 };
    const t = v.records.isbns.length;
    const a = v.records.isbns.filter(i => i.status === 'assigned').length;
    return { total: t, assigned: a, available: t - a };
  }

  saveProfile() {
    this.toast.show('Company profile saved!', 'success');
  }

  saveSection(name: string) {
    this.toast.show(name + ' saved successfully!', 'success');
  }
}
