import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface ParsedFieldRow {
  field: string;
  value: string;
}

/** Maps spreadsheet column labels to AuthorVault company JSON paths */
export const COMPANY_FIELD_MAP: Record<string, string> = {
  'legal name': 'identity.legalName',
  'dba names': 'identity.dbaNames',
  'dba / trade names': 'identity.dbaNames',
  'entity type': 'identity.entityType',
  'business structure': 'identity.entityType',
  'state of incorporation': 'identity.stateOfIncorporation',
  'state of registration': 'identity.stateOfIncorporation',
  'date of formation': 'identity.dateOfFormation',
  'ein / tax id': 'identity.einTaxId',
  'ein': 'identity.einTaxId',
  'tax id': 'identity.einTaxId',
  'registered agent': 'identity.registeredAgent',
  'fiscal year end': 'identity.fiscalYearEnd',
  'company status': 'identity.companyStatus',
  'status': 'identity.companyStatus',
  'primary address': 'identity.primaryAddress',
  'business address': 'identity.primaryAddress',
  'mailing address': 'identity.mailingAddress',
  'phone': 'identity.phone',
  'business phone': 'identity.phone',
  'primary email': 'identity.primaryEmail',
  'main business email': 'identity.primaryEmail',
  'email': 'identity.primaryEmail',
  'website': 'identity.website',
  'bank names': 'financial.bankNames',
  'business checking': 'financial.businessChecking',
  'business savings': 'financial.businessSavings',
  'payment processors': 'financial.paymentProcessors',
  'accounting software': 'financial.accountingSoftware',
  'cpa name': 'financial.cpaName',
  'accountant': 'financial.cpaName',
  'cpa contact': 'financial.cpaContact',
  'accountant contact': 'financial.cpaContact',
  'payroll provider': 'financial.payrollProvider',
  'quarterly tax schedule': 'financial.quarterlyTaxSchedule',
  'tax schedule': 'financial.quarterlyTaxSchedule',
  'state tax registrations': 'financial.stateTaxRegistrations',
  'operating agreement': 'contractsLegal.operatingAgreement',
  'shareholder agreement': 'contractsLegal.shareholderAgreement',
  'trademark registrations': 'contractsLegal.trademarkRegistrations',
  'copyright assignments': 'contractsLegal.copyrightAssignments',
  'insurance policies': 'contractsLegal.insurancePolicies',
  'attorney name': 'contractsLegal.attorneyName',
  'attorney contact': 'contractsLegal.attorneyContact',
  'operating agreement file': 'ownership.operatingAgreementFile',
  's-corp election file': 'ownership.sCorpElectionFile',
};

/**
 * Paths that map to file-upload-only fields.
 * CSV imports must NEVER write text values to these paths
 * because the user cannot supply a file via a spreadsheet.
 */
export const FILE_ONLY_PATHS = new Set<string>([
  'contractsLegal.trademarkRegistrations',
  'contractsLegal.copyrightAssignments',
  'contractsLegal.insurancePolicies',
  'ownership.operatingAgreementFile',
  'ownership.sCorpElectionFile',
]);

@Injectable({ providedIn: 'root' })
export class ExcelImportService {

  async parseFileList(file: File): Promise<any[]> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'csv') {
      const text = await file.text();
      return this.parseCsvList(text);
    }
    if (ext === 'xlsx' || ext === 'xls') {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });
    }
    throw new Error('Please upload a .csv, .xlsx, or .xls file.');
  }

  private parseCsvList(text: string): any[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return [];
    const delimiter = lines[0].includes('\t') ? '\t' : (lines[0].split(';').length > lines[0].split(',').length ? ';' : ',');
    const headers = this.splitCsvLine(lines[0], delimiter).map(h => h.trim());
    const list: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = this.splitCsvLine(lines[i], delimiter);
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx]?.trim() ?? '';
      });
      list.push(obj);
    }
    return list;
  }

  async parseFile(file: File): Promise<ParsedFieldRow[]> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'csv') {
      const text = await file.text();
      return this.parseCsv(text);
    }
    if (ext === 'xlsx' || ext === 'xls') {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      if (rows.length === 0) return [];

      const keys = Object.keys(rows[0]);
      let horizontalMatch = false;
      for (const k of keys) {
        if (this.resolvePath(k)) {
          horizontalMatch = true;
          break;
        }
      }

      if (horizontalMatch) {
        const parsedRows: ParsedFieldRow[] = [];
        keys.forEach(k => {
          parsedRows.push({ field: k, value: String(rows[0][k] ?? '').trim() });
        });
        return parsedRows;
      }

      return this.rowsFromObjects(rows);
    }
    throw new Error('Please upload a .csv, .xlsx, or .xls file.');
  }

  parseCsv(text: string): ParsedFieldRow[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return [];
    const delimiter = lines[0].includes('\t') ? '\t' : (lines[0].split(';').length > lines[0].split(',').length ? ';' : ',');
    const headers = this.splitCsvLine(lines[0], delimiter).map(h => h.trim());

    let horizontalHeaderMatch = false;
    for (const h of headers) {
      if (this.resolvePath(h)) {
        horizontalHeaderMatch = true;
        break;
      }
    }

    if (horizontalHeaderMatch && lines.length > 1) {
      const cols = this.splitCsvLine(lines[1], delimiter);
      const rows: ParsedFieldRow[] = [];
      headers.forEach((h, idx) => {
        if (h && cols[idx] !== undefined) {
          rows.push({ field: h, value: cols[idx].trim() });
        }
      });
      return rows;
    }

    const lowerHeaders = headers.map(h => h.toLowerCase());
    const fieldIdx = lowerHeaders.findIndex(h => h.includes('field') || h === 'name' || h === 'label');
    const valueIdx = lowerHeaders.findIndex(h => h.includes('value') || h.includes('entry') || h === 'data');
    const rows: ParsedFieldRow[] = [];
    if (fieldIdx >= 0 && valueIdx >= 0) {
      for (let i = 1; i < lines.length; i++) {
        const cols = this.splitCsvLine(lines[i], delimiter);
        if (cols[fieldIdx]?.trim()) {
          rows.push({ field: cols[fieldIdx].trim(), value: cols[valueIdx]?.trim() ?? '' });
        }
      }
      return rows;
    }
    const start = headers.length >= 2 && (fieldIdx >= 0 || valueIdx >= 0) ? 1 : 0;
    for (let i = start; i < lines.length; i++) {
      const cols = this.splitCsvLine(lines[i], delimiter);
      if (cols[0]?.trim()) rows.push({ field: cols[0].trim(), value: cols[1]?.trim() ?? '' });
    }
    return rows;
  }

  resolvePath(fieldLabel: string): string | null {
    const key = fieldLabel.trim().toLowerCase();
    return COMPANY_FIELD_MAP[key] ?? COMPANY_FIELD_MAP[key.replace(/\s+/g, ' ')] ?? null;
  }

  private rowsFromObjects(rows: Record<string, unknown>[]): ParsedFieldRow[] {
    if (rows.length === 0) return [];
    const keys = Object.keys(rows[0]);
    const fieldKey = keys.find(k => /field|name|label/i.test(k)) ?? keys[0];
    const valueKey = keys.find(k => /value|entry|data/i.test(k)) ?? keys[1] ?? keys[0];
    return rows
      .map(r => ({
        field: String(r[fieldKey] ?? '').trim(),
        value: String(r[valueKey] ?? '').trim()
      }))
      .filter(r => r.field);
  }

  private splitCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (!inQuotes && ch === delimiter) {
        result.push(current);
        current = '';
        continue;
      }
      current += ch;
    }
    result.push(current);
    return result.map(s => s.replace(/^"|"$/g, '').trim());
  }
}
