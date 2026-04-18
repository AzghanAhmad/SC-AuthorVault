import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BookService } from '../../../services/book.service';
import { ToastService } from '../../../services/toast.service';
import { Book, BookFile, MarketingAsset, PlatformVersion, BookStatus } from '../../../models/book.model';

type TabId = 'overview' | 'files' | 'metadata' | 'platforms' | 'marketing' | 'ai';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page" *ngIf="book()">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a routerLink="/dashboard">Dashboard</a>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span>{{ book()!.title }}</span>
      </div>

      <!-- Page Header -->
      <div class="detail-header">
        <div class="header-left">
          <h1 class="page-title">{{ book()!.title }}</h1>
          <div class="header-meta">
            <span class="badge" [class]="'badge-' + book()!.status">{{ book()!.status }}</span>
            <span class="meta-sep">·</span>
            <span class="meta-text">by {{ book()!.author }}</span>
            <span class="meta-sep">·</span>
            <span class="meta-text">Updated {{ book()!.updatedAt }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-secondary btn-sm" (click)="saveBook()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save
          </button>
          <button class="btn-primary btn-sm" (click)="publishBook()">Publish</button>
        </div>
      </div>

      <!-- Layout: Sidebar + Content -->
      <div class="detail-layout">
        <!-- Left Tab Nav -->
        <nav class="detail-nav">
          @for (tab of tabs; track tab.id) {
            <button class="tab-item" [class.active]="activeTab() === tab.id" (click)="activeTab.set(tab.id)">
              <span class="tab-icon" [innerHTML]="tab.icon"></span>
              <span class="tab-label">{{ tab.label }}</span>
            </button>
          }
        </nav>

        <!-- Main Content -->
        <div class="detail-content">

          <!-- ═══ OVERVIEW ═══ -->
          <div class="tab-panel" *ngIf="activeTab() === 'overview'">
            <div class="summary-cards">
              <div class="summary-card">
                <div class="sc-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                <div class="sc-value">{{ book()!.files.length }}</div>
                <div class="sc-label">Total Files</div>
              </div>
              <div class="summary-card">
                <div class="sc-icon purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg></div>
                <div class="sc-value">{{ configuredPlatforms() }}</div>
                <div class="sc-label">Platforms</div>
              </div>
              <div class="summary-card">
                <div class="sc-icon teal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h2l2-6 4 12 2-6h6"/></svg></div>
                <div class="sc-value">{{ book()!.marketingAssets.length }}</div>
                <div class="sc-label">Marketing Assets</div>
              </div>
              <div class="summary-card">
                <div class="sc-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>
                <div class="sc-value">{{ approvedCount() }}</div>
                <div class="sc-label">Approved</div>
              </div>
            </div>

            <!-- Status Breakdown -->
            <div class="card section-card">
              <h3 class="section-title">Status Breakdown</h3>
              <div class="status-bars">
                @for (st of statusBreakdown(); track st.label) {
                  <div class="status-row">
                    <div class="status-row-label">
                      <span class="status-dot-sm" [style.background]="st.color"></span>
                      {{ st.label }}
                    </div>
                    <div class="status-bar-track">
                      <div class="status-bar-fill" [style.width.%]="st.percent" [style.background]="st.color"></div>
                    </div>
                    <span class="status-count">{{ st.count }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="card section-card">
              <h3 class="section-title">Version History</h3>
              <div class="history-list" *ngIf="book()!.versionHistory.length > 0">
                @for (entry of book()!.versionHistory; track entry.id) {
                  <div class="history-item">
                    <div class="history-dot"></div>
                    <div class="history-info">
                      <span class="history-field">{{ entry.field }}</span> updated by <strong>{{ entry.changedBy }}</strong>
                      <span class="history-date">{{ entry.changedAt }}</span>
                    </div>
                  </div>
                }
              </div>
              <p class="empty-text" *ngIf="book()!.versionHistory.length === 0">No version history yet.</p>
            </div>
          </div>

          <!-- ═══ CORE FILES ═══ -->
          <div class="tab-panel" *ngIf="activeTab() === 'files'">
            <div class="section-header">
              <h2 class="section-title">Core Book Files</h2>
              <button class="btn-primary btn-sm" (click)="showUploadModal = true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload File
              </button>
            </div>

            <!-- Drag & Drop Zone -->
            <div class="drop-zone" (dragover)="$event.preventDefault()" (drop)="onDrop($event)" (click)="showUploadModal = true">
              <div class="drop-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>
              <p class="drop-text">Drag & drop files here, or <span class="drop-cta">click to browse</span></p>
              <p class="drop-hint">Supports EPUB, PDF, Audio, PSD, AI, and more</p>
            </div>

            <!-- File Categories -->
            @for (cat of fileCategories; track cat.key) {
              <div class="file-category">
                <h3 class="cat-title">{{ cat.label }}</h3>
                <div class="file-list" *ngIf="getFilesByCategory(cat.key).length > 0">
                  @for (file of getFilesByCategory(cat.key); track file.id) {
                    <div class="file-card">
                      <div class="file-icon" [class]="'fi-' + file.format">
                        {{ file.format | uppercase }}
                      </div>
                      <div class="file-info">
                        <div class="file-name">{{ file.name }}</div>
                        <div class="file-meta">{{ formatSize(file.size) }} · {{ file.language | uppercase }} · {{ file.uploadedAt }}</div>
                        <div class="file-tags">
                          @for (tag of file.tags; track tag) {
                            <span class="tag-chip">{{ tag }}</span>
                          }
                        </div>
                      </div>
                      <span class="badge" [class]="'badge-' + file.status">{{ file.status }}</span>
                    </div>
                  }
                </div>
                <p class="empty-text" *ngIf="getFilesByCategory(cat.key).length === 0">No {{ cat.label.toLowerCase() }} uploaded yet.</p>
              </div>
            }
          </div>

          <!-- ═══ METADATA ═══ -->
          <div class="tab-panel" *ngIf="activeTab() === 'metadata'">
            <div class="section-header">
              <h2 class="section-title">Book Metadata</h2>
              <div class="header-actions">
                <button class="btn-secondary btn-sm" (click)="saveDraft()">Save Draft</button>
                <button class="btn-primary btn-sm" (click)="publishMetadata()">Publish</button>
              </div>
            </div>

            <div class="card section-card">
              <div class="form-group">
                <label class="form-label">One-Line Hook</label>
                <input type="text" class="form-input" [(ngModel)]="book()!.metadata.oneLineHook" placeholder="A compelling one-liner..." />
              </div>
              <div class="form-group">
                <label class="form-label">Short Blurb</label>
                <textarea class="form-input" rows="3" [(ngModel)]="book()!.metadata.shortBlurb" placeholder="2-3 sentence blurb..."></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Long Blurb</label>
                <textarea class="form-input" rows="6" [(ngModel)]="book()!.metadata.longBlurb" placeholder="Full book description..."></textarea>
              </div>
            </div>

            <div class="card section-card">
              <h3 class="section-title">Keywords & Categories</h3>
              <div class="form-group">
                <label class="form-label">Keywords</label>
                <div class="tag-input-wrap">
                  <div class="tag-list">
                    @for (kw of book()!.metadata.keywords; track kw; let i = $index) {
                      <span class="tag-chip removable">{{ kw }} <button (click)="removeKeyword(i)">&times;</button></span>
                    }
                  </div>
                  <input type="text" class="form-input" placeholder="Type and press Enter..." (keydown.enter)="addKeyword($event)" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">BISAC Categories</label>
                <div class="tag-list" style="margin-bottom:.5rem">
                  @for (cat of book()!.metadata.bisacCategories; track cat) {
                    <span class="tag-chip">{{ cat }}</span>
                  }
                </div>
              </div>
            </div>

            <div class="card section-card">
              <h3 class="section-title">Author & Publishing</h3>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Author Bio</label>
                  <textarea class="form-input" rows="3" [(ngModel)]="book()!.metadata.authorBio" placeholder="About the author..."></textarea>
                </div>
              </div>
              <div class="form-row two-col">
                <div class="form-group">
                  <label class="form-label">Series Name</label>
                  <input type="text" class="form-input" [(ngModel)]="book()!.metadata.seriesName" placeholder="Series name (if any)" />
                </div>
                <div class="form-group">
                  <label class="form-label">Series Number</label>
                  <input type="number" class="form-input" [(ngModel)]="book()!.metadata.seriesNumber" placeholder="#" />
                </div>
              </div>
              <div class="form-row two-col">
                <div class="form-group">
                  <label class="form-label">ISBN</label>
                  <input type="text" class="form-input" [(ngModel)]="book()!.metadata.isbn" placeholder="978-..." />
                </div>
                <div class="form-group">
                  <label class="form-label">Copyright</label>
                  <input type="text" class="form-input" [(ngModel)]="book()!.metadata.copyright" placeholder="© 2024..." />
                </div>
              </div>
              <div class="form-row two-col">
                <div class="form-group">
                  <label class="form-label">Language</label>
                  <select class="form-input" [(ngModel)]="book()!.metadata.language">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Publish Date</label>
                  <input type="date" class="form-input" [(ngModel)]="book()!.metadata.publishDate" />
                </div>
              </div>
            </div>
          </div>

          <!-- ═══ PLATFORM VERSIONS ═══ -->
          <div class="tab-panel" *ngIf="activeTab() === 'platforms'">
            <h2 class="section-title" style="margin-bottom:1.5rem">Platform-Specific Versions</h2>

            @for (platform of book()!.platforms; track platform.platform) {
              <div class="card section-card platform-card">
                <div class="platform-header" (click)="togglePlatform(platform.platform)">
                  <div class="platform-left">
                    <div class="platform-icon" [class]="'pi-' + platform.platform">{{ getPlatformLabel(platform.platform).charAt(0) }}</div>
                    <div>
                      <h3 class="platform-name">{{ getPlatformLabel(platform.platform) }}</h3>
                      <div class="platform-req-summary">
                        {{ getCompletedReqs(platform) }}/{{ platform.requirements.length }} requirements met
                      </div>
                    </div>
                  </div>
                  <svg class="expand-arrow" [class.rotated]="expandedPlatform === platform.platform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>

                <div class="platform-body" *ngIf="expandedPlatform === platform.platform">
                  <!-- Inherit Toggle -->
                  <div class="inherit-toggle">
                    <div class="setting-info">
                      <span class="setting-label">Inherit from base metadata</span>
                      <span class="setting-desc">When enabled, this platform uses your base book metadata</span>
                    </div>
                    <input type="checkbox" class="toggle" [(ngModel)]="platform.inheritsBase" />
                  </div>

                  <div *ngIf="!platform.inheritsBase" class="platform-fields">
                    <div class="form-group">
                      <label class="form-label">Custom Description</label>
                      <textarea class="form-input" rows="4" [(ngModel)]="platform.customDescription" placeholder="Platform-specific description..."></textarea>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Subtitle</label>
                      <input type="text" class="form-input" [(ngModel)]="platform.subtitle" placeholder="Platform subtitle..." />
                    </div>
                  </div>

                  <!-- Requirements Checklist -->
                  <div class="req-section">
                    <h4 class="req-title">Requirements Checklist</h4>
                    @for (req of platform.requirements; track req.label) {
                      <label class="req-item">
                        <input type="checkbox" [(ngModel)]="req.completed" class="req-check" />
                        <span [class.completed]="req.completed">{{ req.label }}</span>
                      </label>
                    }
                    <p class="empty-text" *ngIf="platform.requirements.length === 0">No requirements for this platform.</p>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- ═══ MARKETING ASSETS ═══ -->
          <div class="tab-panel" *ngIf="activeTab() === 'marketing'">
            <div class="section-header">
              <h2 class="section-title">Marketing Assets</h2>
              <button class="btn-primary btn-sm" (click)="showAssetModal = true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Asset
              </button>
            </div>

            <div class="asset-grid" *ngIf="book()!.marketingAssets.length > 0">
              @for (asset of book()!.marketingAssets; track asset.id) {
                <div class="asset-card">
                  <div class="asset-header">
                    <span class="asset-type-badge" [class]="'at-' + asset.type">{{ assetTypeLabel(asset.type) }}</span>
                    <span class="badge" [class]="'badge-' + asset.status">{{ asset.status }}</span>
                  </div>
                  <h4 class="asset-title">{{ asset.title }}</h4>
                  <p class="asset-preview">{{ asset.content | slice:0:120 }}{{ asset.content.length > 120 ? '...' : '' }}</p>
                  <div class="asset-footer">
                    <div class="asset-tags">
                      @for (tag of asset.tags; track tag) {
                        <span class="tag-chip sm">{{ tag }}</span>
                      }
                    </div>
                    <span class="asset-meta">{{ asset.platform }} · {{ asset.updatedAt }}</span>
                  </div>
                </div>
              }
            </div>
            <div class="empty-state" *ngIf="book()!.marketingAssets.length === 0">
              <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12h2l2-6 4 12 2-6h6"/></svg></div>
              <h3>No marketing assets</h3>
              <p>Start building your marketing toolkit</p>
            </div>
          </div>

          <!-- ═══ AI TOOLS ═══ -->
          <div class="tab-panel" *ngIf="activeTab() === 'ai'">
            <h2 class="section-title" style="margin-bottom:.5rem">AI Tools</h2>
            <p class="section-subtitle">Generate content using AI-powered tools (simulation)</p>

            <div class="ai-actions">
              @for (action of aiActions; track action.label) {
                <button class="ai-action-btn" (click)="runAiAction(action)" [disabled]="aiLoading()">
                  <span class="ai-icon" [innerHTML]="action.icon"></span>
                  <div>
                    <span class="ai-label">{{ action.label }}</span>
                    <span class="ai-desc">{{ action.description }}</span>
                  </div>
                </button>
              }
            </div>

            <!-- AI Output -->
            <div class="card section-card ai-output" *ngIf="aiResult() || aiLoading()">
              <div class="ai-output-header">
                <h3 class="section-title">AI Output</h3>
                <button class="btn-secondary btn-sm" *ngIf="aiResult()" (click)="copyToClipboard(aiResult())">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy
                </button>
              </div>
              <div class="ai-loading" *ngIf="aiLoading()">
                <div class="ai-spinner"></div>
                <span>Generating content...</span>
              </div>
              <pre class="ai-result" *ngIf="!aiLoading() && aiResult()">{{ aiResult() }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Upload Modal -->
      <div class="modal-overlay" *ngIf="showUploadModal" (click)="showUploadModal = false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header"><h2>Upload File</h2><button class="modal-close" (click)="showUploadModal = false">&times;</button></div>
          <div class="modal-body">
            <div class="form-group"><label class="form-label">File Name</label><input type="text" class="form-input" [(ngModel)]="uploadFileName" placeholder="your-file.epub" /></div>
            <div class="form-row two-col">
              <div class="form-group"><label class="form-label">Format</label><select class="form-input" [(ngModel)]="uploadFormat"><option value="epub">EPUB</option><option value="pdf">PDF</option><option value="audio">Audio</option><option value="psd">PSD</option><option value="ai">AI</option></select></div>
              <div class="form-group"><label class="form-label">Category</label><select class="form-input" [(ngModel)]="uploadCategory"><option value="ebook-master">Ebook Master</option><option value="paperback-interior">Paperback Interior</option><option value="hardcover-interior">Hardcover Interior</option><option value="audiobook">Audiobook</option><option value="cover-source">Cover Source</option></select></div>
            </div>
          </div>
          <div class="modal-footer"><button class="btn-secondary" (click)="showUploadModal = false">Cancel</button><button class="btn-primary" (click)="uploadFile()">Upload</button></div>
        </div>
      </div>

      <!-- Asset Modal -->
      <div class="modal-overlay" *ngIf="showAssetModal" (click)="showAssetModal = false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header"><h2>Add Marketing Asset</h2><button class="modal-close" (click)="showAssetModal = false">&times;</button></div>
          <div class="modal-body">
            <div class="form-group"><label class="form-label">Title</label><input type="text" class="form-input" [(ngModel)]="newAssetTitle" placeholder="Asset title" /></div>
            <div class="form-row two-col">
              <div class="form-group"><label class="form-label">Type</label><select class="form-input" [(ngModel)]="newAssetType"><option value="ad">Ad</option><option value="headline">Headline</option><option value="newsletter">Newsletter</option><option value="social-post">Social Post</option><option value="blog">Blog</option><option value="promo-graphic">Promo Graphic</option></select></div>
              <div class="form-group"><label class="form-label">Platform</label><input type="text" class="form-input" [(ngModel)]="newAssetPlatform" placeholder="e.g. Facebook" /></div>
            </div>
            <div class="form-group"><label class="form-label">Content</label><textarea class="form-input" rows="4" [(ngModel)]="newAssetContent" placeholder="Asset content..."></textarea></div>
          </div>
          <div class="modal-footer"><button class="btn-secondary" (click)="showAssetModal = false">Cancel</button><button class="btn-primary" (click)="addAsset()">Add Asset</button></div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="page" *ngIf="!book() && !notFound">
      <div class="skeleton" style="height:32px;width:200px;margin-bottom:1.5rem"></div>
      <div class="skeleton" style="height:48px;width:60%;margin-bottom:1rem"></div>
      <div class="skeleton" style="height:20px;width:40%;margin-bottom:2rem"></div>
      <div style="display:grid;grid-template-columns:200px 1fr;gap:2rem">
        <div><div class="skeleton" style="height:300px;border-radius:16px"></div></div>
        <div><div class="skeleton" style="height:400px;border-radius:16px"></div></div>
      </div>
    </div>

    <div class="page empty-state" *ngIf="notFound" style="padding-top:4rem">
      <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
      <h3>Book not found</h3>
      <p>The book you're looking for doesn't exist.</p>
      <a routerLink="/dashboard" class="btn-primary">Back to Dashboard</a>
    </div>
  `,
  styles: [`
    .page { max-width:1200px; width:100%; }

    /* Breadcrumb */
    .breadcrumb { display:flex;align-items:center;gap:.5rem;font-size:.8125rem;color:var(--text-muted);margin-bottom:1.5rem; }
    .breadcrumb a { color:var(--accent-blue);text-decoration:none;font-weight:500; }
    .breadcrumb a:hover { text-decoration:underline; }
    .breadcrumb svg { width:14px;height:14px; }

    /* Header */
    .detail-header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;flex-wrap:wrap;gap:1rem; }
    .page-title { font-size:1.75rem;font-weight:700;color:var(--text-primary);margin:0 0 .5rem; }
    .header-meta { display:flex;align-items:center;gap:.5rem;font-size:.8125rem;flex-wrap:wrap; }
    .meta-sep { color:var(--text-muted); }
    .meta-text { color:var(--text-muted); }
    .header-actions { display:flex;gap:.5rem; }

    /* Layout */
    .detail-layout { display:grid;grid-template-columns:220px 1fr;gap:2rem; }

    /* Tab Nav */
    .detail-nav { display:flex;flex-direction:column;gap:.25rem;position:sticky;top:1rem;align-self:flex-start; }
    .tab-item { display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;background:transparent;border:none;border-radius:10px;font-size:.875rem;font-weight:500;color:var(--text-secondary);cursor:pointer;transition:all .2s;text-align:left;font-family:inherit; }
    .tab-item:hover { background:rgba(59,130,246,.05);color:var(--text-primary); }
    .tab-item.active { background:rgba(59,130,246,.08);color:var(--accent-blue);font-weight:600; }
    .tab-icon { width:20px;height:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .tab-icon :first-child { width:18px;height:18px; }

    /* Content Cards */
    .card { background:var(--surface);border:1px solid var(--border-light);border-radius:16px;padding:1.5rem;box-shadow:var(--shadow-sm); }
    .section-card { margin-bottom:1.25rem; }
    .section-title { font-size:1.125rem;font-weight:600;color:var(--text-primary);margin:0 0 .5rem; }
    .section-subtitle { font-size:.875rem;color:var(--text-muted);margin:0 0 1.5rem; }
    .section-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:.75rem; }

    /* Overview Summary Cards */
    .summary-cards { display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem; }
    .summary-card { background:var(--surface);border:1px solid var(--border-light);border-radius:16px;padding:1.25rem;text-align:center;box-shadow:var(--shadow-sm);transition:all .3s; }
    .summary-card:hover { transform:translateY(-2px);box-shadow:var(--shadow-md); }
    .sc-icon { width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto .75rem; }
    .sc-icon svg { width:20px;height:20px; }
    .sc-icon.blue { background:rgba(59,130,246,.1);color:#3b82f6; }
    .sc-icon.purple { background:rgba(139,92,246,.1);color:#8b5cf6; }
    .sc-icon.teal { background:rgba(20,184,166,.1);color:#14b8a6; }
    .sc-icon.green { background:rgba(16,185,129,.1);color:#10b981; }
    .sc-value { font-size:1.75rem;font-weight:700;color:var(--text-primary);line-height:1.2; }
    .sc-label { font-size:.75rem;color:var(--text-muted);margin-top:.25rem; }

    /* Status Bars */
    .status-bars { display:flex;flex-direction:column;gap:.75rem;margin-top:1rem; }
    .status-row { display:flex;align-items:center;gap:1rem; }
    .status-row-label { min-width:100px;font-size:.8125rem;font-weight:500;color:var(--text-secondary);display:flex;align-items:center;gap:.5rem; }
    .status-dot-sm { width:8px;height:8px;border-radius:50%;flex-shrink:0; }
    .status-bar-track { flex:1;height:8px;background:var(--border-light);border-radius:100px;overflow:hidden; }
    .status-bar-fill { height:100%;border-radius:100px;transition:width .5s cubic-bezier(.4,0,.2,1); }
    .status-count { font-size:.8125rem;font-weight:600;color:var(--text-primary);min-width:24px;text-align:right; }

    /* History */
    .history-list { display:flex;flex-direction:column;gap:.75rem;margin-top:.75rem; }
    .history-item { display:flex;align-items:flex-start;gap:.75rem;font-size:.8125rem;color:var(--text-secondary); }
    .history-dot { width:8px;height:8px;border-radius:50%;background:var(--accent-blue);margin-top:5px;flex-shrink:0; }
    .history-field { font-weight:600;color:var(--text-primary); }
    .history-date { color:var(--text-muted);margin-left:.5rem; }

    /* Files */
    .drop-zone { border:2px dashed var(--border-color);border-radius:16px;padding:2.5rem;text-align:center;cursor:pointer;transition:all .3s;margin-bottom:1.5rem; }
    .drop-zone:hover { border-color:var(--accent-blue);background:rgba(59,130,246,.03); }
    .drop-icon { margin:0 auto .75rem;color:var(--text-muted); }
    .drop-icon svg { width:40px;height:40px; }
    .drop-text { font-size:.9rem;color:var(--text-secondary);margin:0 0 .25rem; }
    .drop-cta { color:var(--accent-blue);font-weight:600; }
    .drop-hint { font-size:.75rem;color:var(--text-muted);margin:0; }

    .file-category { margin-bottom:1.5rem; }
    .cat-title { font-size:.9375rem;font-weight:600;color:var(--text-primary);margin:0 0 .75rem;padding-bottom:.5rem;border-bottom:1px solid var(--border-light); }
    .file-list { display:flex;flex-direction:column;gap:.5rem; }
    .file-card { display:flex;align-items:center;gap:1rem;padding:1rem;background:var(--surface);border:1px solid var(--border-light);border-radius:12px;transition:all .2s; }
    .file-card:hover { box-shadow:var(--shadow-md); }
    .file-icon { width:48px;height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:.6875rem;font-weight:700;letter-spacing:.03em;flex-shrink:0; }
    .fi-epub { background:rgba(59,130,246,.1);color:#3b82f6; }
    .fi-pdf { background:rgba(239,68,68,.1);color:#ef4444; }
    .fi-audio { background:rgba(139,92,246,.1);color:#8b5cf6; }
    .fi-psd,.fi-ai { background:rgba(20,184,166,.1);color:#14b8a6; }
    .fi-docx { background:rgba(59,130,246,.1);color:#2563eb; }
    .fi-png,.fi-jpg { background:rgba(245,158,11,.1);color:#f59e0b; }
    .file-info { flex:1;min-width:0; }
    .file-name { font-size:.875rem;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .file-meta { font-size:.75rem;color:var(--text-muted);margin-top:.15rem; }
    .file-tags { display:flex;gap:.25rem;margin-top:.375rem;flex-wrap:wrap; }

    /* Tags */
    .tag-chip { display:inline-flex;align-items:center;gap:.25rem;padding:2px 8px;background:var(--primary-light);border:1px solid var(--border-color);border-radius:6px;font-size:.6875rem;font-weight:500;color:var(--text-secondary); }
    .tag-chip.sm { font-size:.625rem;padding:1px 6px; }
    .tag-chip.removable button { background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.875rem;line-height:1;padding:0 0 0 2px; }
    .tag-input-wrap { display:flex;flex-direction:column;gap:.5rem; }
    .tag-list { display:flex;gap:.375rem;flex-wrap:wrap; }

    /* Form Rows */
    .form-group { margin-bottom:1rem; }
    .form-row { margin-bottom:0; }
    .form-row.two-col { display:grid;grid-template-columns:1fr 1fr;gap:1rem; }

    /* Platforms */
    .platform-card { padding:0;overflow:hidden; }
    .platform-header { display:flex;justify-content:space-between;align-items:center;padding:1.25rem 1.5rem;cursor:pointer;transition:background .2s; }
    .platform-header:hover { background:var(--background); }
    .platform-left { display:flex;align-items:center;gap:1rem; }
    .platform-icon { width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.125rem;font-weight:700;color:white;flex-shrink:0; }
    .pi-amazon { background:linear-gradient(135deg,#ff9900,#e47911); }
    .pi-kobo { background:linear-gradient(135deg,#c9232d,#a01b24); }
    .pi-apple { background:linear-gradient(135deg,#555,#333); }
    .pi-barnes-noble { background:linear-gradient(135deg,#2a6d3c,#1e5430); }
    .platform-name { font-size:.9375rem;font-weight:600;color:var(--text-primary);margin:0; }
    .platform-req-summary { font-size:.75rem;color:var(--text-muted); }
    .expand-arrow { width:20px;height:20px;transition:transform .3s;color:var(--text-muted); }
    .expand-arrow.rotated { transform:rotate(180deg); }

    .platform-body { padding:0 1.5rem 1.5rem;border-top:1px solid var(--border-light); }
    .inherit-toggle { display:flex;align-items:center;justify-content:space-between;padding:1rem;background:var(--background);border-radius:12px;margin:1rem 0; }
    .setting-label { font-size:.875rem;font-weight:600;color:var(--text-primary);display:block; }
    .setting-desc { font-size:.8125rem;color:var(--text-muted); }
    .platform-fields { margin-top:1rem; }

    .req-section { margin-top:1.25rem; }
    .req-title { font-size:.8125rem;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;margin:0 0 .75rem; }
    .req-item { display:flex;align-items:center;gap:.75rem;padding:.5rem 0;font-size:.875rem;color:var(--text-secondary);cursor:pointer; }
    .req-check { accent-color:var(--accent-blue); }
    .req-item .completed { color:var(--success);text-decoration:line-through; }

    /* Marketing Assets */
    .asset-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem; }
    .asset-card { background:var(--surface);border:1px solid var(--border-light);border-radius:14px;padding:1.25rem;transition:all .3s;box-shadow:var(--shadow-sm); }
    .asset-card:hover { box-shadow:var(--shadow-md);transform:translateY(-2px); }
    .asset-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem; }
    .asset-type-badge { padding:3px 10px;border-radius:8px;font-size:.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:.03em; }
    .at-ad { background:rgba(59,130,246,.1);color:#3b82f6; }
    .at-headline { background:rgba(139,92,246,.1);color:#8b5cf6; }
    .at-newsletter { background:rgba(20,184,166,.1);color:#14b8a6; }
    .at-social-post { background:rgba(236,72,153,.1);color:#ec4899; }
    .at-blog { background:rgba(245,158,11,.1);color:#f59e0b; }
    .at-promo-graphic { background:rgba(16,185,129,.1);color:#10b981; }
    .asset-title { font-size:.9375rem;font-weight:600;color:var(--text-primary);margin:0 0 .5rem; }
    .asset-preview { font-size:.8125rem;color:var(--text-muted);line-height:1.5;margin:0 0 .75rem;white-space:pre-line; }
    .asset-footer { display:flex;justify-content:space-between;align-items:flex-end; }
    .asset-tags { display:flex;gap:.25rem;flex-wrap:wrap; }
    .asset-meta { font-size:.6875rem;color:var(--text-muted); }

    /* AI Tools */
    .ai-actions { display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin-bottom:1.5rem; }
    .ai-action-btn { display:flex;align-items:flex-start;gap:1rem;padding:1.25rem;background:var(--surface);border:1.5px solid var(--border-color);border-radius:14px;cursor:pointer;transition:all .3s;text-align:left;font-family:inherit; }
    .ai-action-btn:hover:not(:disabled) { border-color:var(--accent-indigo);box-shadow:var(--shadow-glow-purple);transform:translateY(-2px); }
    .ai-action-btn:disabled { opacity:.5;cursor:not-allowed; }
    .ai-icon { width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,rgba(99,102,241,.1),rgba(139,92,246,.1));display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--accent-indigo); }
    .ai-icon :first-child { width:20px;height:20px; }
    .ai-label { font-size:.875rem;font-weight:600;color:var(--text-primary);display:block;margin-bottom:.15rem; }
    .ai-desc { font-size:.75rem;color:var(--text-muted); }

    .ai-output-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem; }
    .ai-loading { display:flex;align-items:center;gap:.75rem;color:var(--accent-indigo);font-size:.875rem;font-weight:500; }
    .ai-spinner { width:20px;height:20px;border:2px solid rgba(99,102,241,.2);border-top-color:var(--accent-indigo);border-radius:50%;animation:spin .8s linear infinite; }
    .ai-result { font-size:.8125rem;line-height:1.7;color:var(--text-secondary);white-space:pre-wrap;font-family:'Inter',sans-serif;margin:0;background:var(--background);padding:1.25rem;border-radius:12px;border:1px solid var(--border-light); }

    .empty-text { font-size:.8125rem;color:var(--text-muted);font-style:italic; }
    .empty-state { text-align:center;padding:3rem 2rem; }
    .empty-icon { width:64px;height:64px;margin:0 auto 1rem;background:var(--primary-light);border-radius:16px;display:flex;align-items:center;justify-content:center;color:var(--accent-blue); }
    .empty-icon svg { width:28px;height:28px; }
    .empty-state h3 { font-size:1.125rem;font-weight:700;color:var(--text-primary);margin:0 0 .375rem; }
    .empty-state p { font-size:.85rem;color:var(--text-muted);margin:0; }

    /* Modals */
    .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem; }
    .modal-card { background:var(--surface);border-radius:18px;width:100%;max-width:520px;box-shadow:var(--shadow-xl);animation:fadeInUp .3s cubic-bezier(.4,0,.2,1); }
    .modal-header { display:flex;justify-content:space-between;align-items:center;padding:1.5rem 1.5rem 0; }
    .modal-header h2 { font-size:1.25rem;font-weight:700;color:var(--text-primary);margin:0; }
    .modal-close { background:none;border:none;font-size:1.5rem;color:var(--text-muted);cursor:pointer; }
    .modal-body { padding:1.5rem; }
    .modal-footer { padding:0 1.5rem 1.5rem;display:flex;justify-content:flex-end;gap:.75rem; }

    @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin { to{transform:rotate(360deg)} }

    @media(max-width:768px) {
      .detail-layout { grid-template-columns:1fr; }
      .detail-nav { flex-direction:row;overflow-x:auto;position:static;gap:.25rem; }
      .tab-label { display:none; }
      .summary-cards { grid-template-columns:repeat(2,1fr); }
      .ai-actions { grid-template-columns:1fr; }
      .form-row.two-col { grid-template-columns:1fr; }
    }
  `]
})
export class BookDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bookService = inject(BookService);
  private toast = inject(ToastService);
  private router = inject(Router);

  book = signal<Book | null>(null);
  activeTab = signal<TabId>('overview');
  notFound = false;

  expandedPlatform = '';
  showUploadModal = false;
  showAssetModal = false;

  // Upload form
  uploadFileName = '';
  uploadFormat = 'epub';
  uploadCategory = 'ebook-master';

  // Asset form
  newAssetTitle = '';
  newAssetType = 'ad';
  newAssetPlatform = '';
  newAssetContent = '';

  // AI
  aiLoading = signal(false);
  aiResult = signal('');

  tabs = [
    { id: 'overview' as TabId, label: 'Overview', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V21h14V9.8"/></svg>' },
    { id: 'files' as TabId, label: 'Core Files', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>' },
    { id: 'metadata' as TabId, label: 'Metadata', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>' },
    { id: 'platforms' as TabId, label: 'Platforms', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>' },
    { id: 'marketing' as TabId, label: 'Marketing', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h2l2-6 4 12 2-6h6"/></svg>' },
    { id: 'ai' as TabId, label: 'AI Tools', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 0-4 4c0 2.5 2 4 4 6 2-2 4-3.5 4-6a4 4 0 0 0-4-4z"/><circle cx="12" cy="18" r="4"/></svg>' },
  ];

  fileCategories = [
    { key: 'ebook-master', label: 'Ebook Master' },
    { key: 'paperback-interior', label: 'Paperback Interior' },
    { key: 'hardcover-interior', label: 'Hardcover Interior' },
    { key: 'audiobook', label: 'Audiobook Files' },
    { key: 'cover-source', label: 'Cover Source Files' },
  ];

  aiActions = [
    { label: 'Generate Amazon Blurb', description: 'Create an optimized blurb for Amazon KDP listing', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>', mock: 'GENERATED AMAZON BLURB:\n\n★★★★★ "Absolutely riveting!" — Featured Amazon Editor\'s Pick\n\nIn this masterfully crafted story, readers will discover a world where every choice creates a new reality. With lyrical prose and unforgettable characters, this is a novel that will stay with you long after the last page.\n\n✦ A journey through infinite possibilities\n✦ Characters that feel like old friends\n✦ A thought-provoking exploration of regret and hope\n\nPerfect for fans of literary fiction that pushes boundaries.\n\n📖 Available in Kindle, Paperback, and Audiobook.\n\n"One of the best novels I\'ve read this year." — BookList\n"A triumph of imagination." — Publishers Weekly' },
    { label: 'Create Facebook Ads', description: 'Generate high-converting ad copy for Facebook campaigns', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h2l2-6 4 12 2-6h6"/></svg>', mock: 'FACEBOOK AD COPY (3 Variations):\n\n--- Ad 1: Curiosity Hook ---\nWhat if you could live every life you never chose?\n\nDiscover the book that 50,000+ readers can\'t stop talking about.\n📚 Available on Amazon, Kobo, Apple Books & more.\n\nCTA: Get Your Copy →\n\n--- Ad 2: Social Proof ---\n★★★★★ 2,500+ 5-star reviews\n"This book changed how I think about my life." — Reader Review\n\nJoin the movement. Read the book everyone is recommending.\n\nCTA: Read Free Sample →\n\n--- Ad 3: Urgency ---\n🔥 LIMITED TIME: 40% off the #1 bestseller in Literary Fiction.\n\nDon\'t miss out on the novel that\'s redefining the genre.\n\nCTA: Grab the Deal →' },
    { label: 'Draft Newsletter', description: 'Create an engaging newsletter for your reader list', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>', mock: 'NEWSLETTER DRAFT:\n\nSubject Line: A new chapter begins...\n\nDear [Reader],\n\nI have exciting news to share!\n\nMy latest book is now available, and I couldn\'t be more thrilled to finally put it in your hands. This one has been a labor of love — months of research, countless revisions, and many late nights.\n\nHere\'s what readers are saying:\n"Incredible storytelling..." ★★★★★\n"I couldn\'t put it down!" ★★★★★\n\nAs a valued subscriber, you get an exclusive 20% discount:\nUse code: READER20 at checkout.\n\n📖 Grab your copy: [LINK]\n\nThank you for being part of this journey.\n\nWarmly,\n[Author Name]' },
    { label: 'Pull Approved Assets', description: 'Compile all approved marketing materials into one document', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>', mock: 'APPROVED ASSETS COMPILATION:\n\n═══════════════════════════════\n1. Amazon Launch Ad — Facebook\n   Status: ✅ Approved\n   Platform: Facebook\n   Campaign: Launch Q1 2024\n\n   Content:\n   📚 Discover the novel about all the lives you could have lived.\n   Available on Kindle & in print.\n   ⭐⭐⭐⭐⭐ "Life-changing read!"\n\n═══════════════════════════════\n2. Newsletter Announcement\n   Status: ✅ Approved\n   Platform: Email\n   Campaign: Launch Q1 2024\n\n═══════════════════════════════\n3. Instagram Carousel Headlines\n   Status: ✅ Approved\n   Platform: Instagram\n   Campaign: Social Launch\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTotal Approved: 3 assets\nTotal Draft: 2 assets\nCompiled: ' + new Date().toLocaleDateString() },
  ];

  configuredPlatforms = signal(0);
  approvedCount = signal(0);
  statusBreakdown = signal<{ label: string; count: number; percent: number; color: string }[]>([]);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.notFound = true; return; }

    this.bookService.getBookById(id).subscribe(book => {
      if (!book) { this.notFound = true; return; }
      this.book.set(book);
      this.computeStats(book);
    });
  }

  private computeStats(book: Book) {
    this.configuredPlatforms.set(book.platforms.filter(p => !p.inheritsBase || p.requirements.length > 0).length);
    const allItems = [...book.files, ...book.marketingAssets];
    const approved = allItems.filter(i => i.status === 'approved').length;
    const draft = allItems.filter(i => i.status === 'draft').length;
    const pending = allItems.filter(i => i.status === 'pending').length;
    const published = allItems.filter(i => i.status === 'published').length;
    const total = allItems.length || 1;
    this.approvedCount.set(approved);
    this.statusBreakdown.set([
      { label: 'Approved', count: approved, percent: (approved / total) * 100, color: '#10b981' },
      { label: 'Draft', count: draft, percent: (draft / total) * 100, color: '#f59e0b' },
      { label: 'Pending', count: pending, percent: (pending / total) * 100, color: '#3b82f6' },
      { label: 'Published', count: published, percent: (published / total) * 100, color: '#8b5cf6' },
    ]);
  }

  getFilesByCategory(category: string): BookFile[] {
    return this.book()?.files.filter(f => f.category === category) || [];
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
  }

  getPlatformLabel(p: string): string {
    const map: Record<string, string> = { amazon: 'Amazon', kobo: 'Kobo', apple: 'Apple Books', 'barnes-noble': 'Barnes & Noble' };
    return map[p] || p;
  }

  getCompletedReqs(p: PlatformVersion): number {
    return p.requirements.filter(r => r.completed).length;
  }

  togglePlatform(platform: string) {
    this.expandedPlatform = this.expandedPlatform === platform ? '' : platform;
  }

  assetTypeLabel(type: string): string {
    const map: Record<string, string> = { ad: 'Ad', headline: 'Headline', newsletter: 'Newsletter', 'social-post': 'Social Post', blog: 'Blog', 'promo-graphic': 'Promo' };
    return map[type] || type;
  }

  addKeyword(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (value && this.book()) {
      this.book()!.metadata.keywords.push(value);
      input.value = '';
    }
  }

  removeKeyword(index: number) {
    this.book()!.metadata.keywords.splice(index, 1);
  }

  saveBook() {
    if (!this.book()) return;
    this.bookService.updateBook(this.book()!).subscribe(() => {
      this.toast.show('Book saved successfully!', 'success');
    });
  }

  publishBook() {
    if (!this.book()) return;
    this.book()!.status = 'published';
    this.saveBook();
  }

  saveDraft() { this.toast.show('Draft saved!', 'success'); }
  publishMetadata() { this.toast.show('Metadata published!', 'success'); }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.showUploadModal = true;
  }

  uploadFile() {
    if (!this.book() || !this.uploadFileName.trim()) return;
    this.bookService.uploadFile(this.book()!.id, {
      name: this.uploadFileName, format: this.uploadFormat as any, category: this.uploadCategory as any, size: Math.floor(Math.random() * 10000000)
    }).subscribe(() => {
      this.showUploadModal = false;
      this.uploadFileName = '';
      this.bookService.getBookById(this.book()!.id).subscribe(b => { if (b) { this.book.set(b); this.computeStats(b); } });
      this.toast.show('File uploaded!', 'success');
    });
  }

  addAsset() {
    if (!this.book() || !this.newAssetTitle.trim()) return;
    this.bookService.addMarketingAsset(this.book()!.id, {
      title: this.newAssetTitle, type: this.newAssetType as any, platform: this.newAssetPlatform, content: this.newAssetContent
    }).subscribe(() => {
      this.showAssetModal = false;
      this.newAssetTitle = ''; this.newAssetContent = ''; this.newAssetPlatform = '';
      this.bookService.getBookById(this.book()!.id).subscribe(b => { if (b) { this.book.set(b); this.computeStats(b); } });
      this.toast.show('Marketing asset added!', 'success');
    });
  }

  runAiAction(action: { label: string; mock: string }) {
    this.aiLoading.set(true);
    this.aiResult.set('');
    setTimeout(() => {
      this.aiResult.set(action.mock);
      this.aiLoading.set(false);
    }, 1500 + Math.random() * 1000);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.toast.show('Copied to clipboard!', 'success');
    });
  }
}
