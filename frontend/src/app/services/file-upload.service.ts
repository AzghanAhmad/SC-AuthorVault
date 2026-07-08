import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UploadedFileDto {
  id: number;
  fileName: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  category: string;
}

@Injectable({ providedIn: 'root' })
export class FileUploadService {
  private readonly http = inject(HttpClient);

  upload(file: File, category = 'general'): Observable<UploadedFileDto> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<UploadedFileDto>(
      `${environment.apiUrl}/files/upload?category=${encodeURIComponent(category)}`,
      form
    );
  }

  /** Fetch a Canva share/design link (or any public image URL) and store it server-side. */
  importFromUrl(url: string, fileName?: string, category = 'logo-canva'): Observable<UploadedFileDto> {
    return this.http.post<UploadedFileDto>(`${environment.apiUrl}/files/import-from-url`, {
      url,
      fileName: fileName || null,
      category,
    });
  }

  list(category?: string): Observable<UploadedFileDto[]> {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.http.get<UploadedFileDto[]>(`${environment.apiUrl}/files${q}`);
  }

  delete(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${environment.apiUrl}/files/${id}`);
  }

  resolveFileUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const apiBase = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${apiBase}${url.startsWith('/') ? url : '/' + url}`;
  }

  storageInfo(): Observable<{ provider: string; configured: boolean }> {
    return this.http.get<{ provider: string; configured: boolean }>(`${environment.apiUrl}/files/storage-info`);
  }
}
