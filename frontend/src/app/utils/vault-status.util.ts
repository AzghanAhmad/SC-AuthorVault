export type VaultStatusKind =
  | 'company'
  | 'corporateDoc'
  | 'taxDoc'
  | 'contract'
  | 'financialDoc'
  | 'isbn'
  | 'platform'
  | 'dmarc'
  | 'ssl';

export const VAULT_STATUS_OPTIONS: Record<VaultStatusKind, readonly string[]> = {
  company: ['Active', 'Inactive', 'Dissolved'],
  corporateDoc: ['Current', 'Pending', 'Needs Renewal', 'Expired', 'Filed', 'Not Filed'],
  taxDoc: ['Filed', 'Pending', 'Overdue', 'Not Applicable'],
  contract: ['Draft', 'Active', 'Expired', 'Pending Renewal', 'Template', 'Terminated'],
  financialDoc: ['Approved', 'Pending Review', 'Rejected', 'Archived'],
  isbn: ['used', 'unused', 'reserved'],
  platform: ['active', 'pending', 'suspended', 'inactive'],
  dmarc: ['none', 'quarantine', 'reject', 'not configured'],
  ssl: ['active', 'expiring', 'expired', 'not configured'],
};

const GREEN = new Set([
  'active', 'Active', 'Live', 'Published', 'Approved', 'Current', 'Filed', 'used', 'Success', 'Complete', 'Won',
]);
const AMBER = new Set([
  'pending', 'Pending', 'Pending Review', 'Pending Renewal', 'reserved', 'Draft', 'Editing', 'Paused', 'Hiatus',
  'Needs Renewal', 'expiring', 'quarantine', 'Template', 'Planned', 'In Progress',
]);
const RED = new Set([
  'Inactive', 'Dissolved', 'Expired', 'Rejected', 'Overdue', 'suspended', 'Terminated', 'Failed', 'expired', 'reject',
  'Retired', 'Unpublished',
]);
const BLUE = new Set([
  'unused', 'Ready', 'Finalist', 'Complete', 'not configured', 'none', 'Not Filed', 'Not Applicable',
]);

export function vaultStatusOptions(kind: VaultStatusKind): string[] {
  return [...VAULT_STATUS_OPTIONS[kind]];
}

export function vaultStatusClass(status: string): string {
  const s = (status || '').trim();
  if (!s) return 'status-default';
  if (GREEN.has(s)) return 'status-green';
  if (RED.has(s)) return 'status-red';
  if (AMBER.has(s)) return 'status-amber';
  if (BLUE.has(s)) return 'status-blue';
  const lower = s.toLowerCase();
  if (lower.includes('active') || lower.includes('approv') || lower.includes('filed') || lower.includes('current')) {
    return 'status-green';
  }
  if (lower.includes('expir') || lower.includes('reject') || lower.includes('overdue') || lower.includes('terminat')) {
    return 'status-red';
  }
  if (lower.includes('pending') || lower.includes('draft') || lower.includes('renew')) {
    return 'status-amber';
  }
  return 'status-default';
}

export function vaultStatusLabel(status: string): string {
  if (!status) return '—';
  if (status === 'used') return 'Used';
  if (status === 'unused') return 'Available';
  if (status === 'reserved') return 'Reserved';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function mergeStatusOptions(kind: VaultStatusKind, current: string): string[] {
  const base = vaultStatusOptions(kind);
  if (!current || base.includes(current)) return base;
  return [...base, current];
}
