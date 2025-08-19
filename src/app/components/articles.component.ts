import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Article, ComplianceResult, PublishRequest } from '../models/article.model';
import { FeedConfig } from '../models/feed.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="articles-section">
      <div class="header">
        <h2>Articles Management</h2>
        <button (click)="showCreateForm = !showCreateForm" class="btn-primary">
          {{ showCreateForm ? 'Cancel' : 'Create Article' }}
        </button>
      </div>

      <!-- Create/Edit Article Form -->
      <form *ngIf="showCreateForm" (ngSubmit)="saveArticle()" class="article-form">
        <h3>{{ editingArticle?.id ? 'Edit' : 'Create' }} Article</h3>
        <input [(ngModel)]="currentArticle.title" name="title" placeholder="Title" required>
        <textarea [(ngModel)]="currentArticle.body" name="body" placeholder="Article body" rows="10" required></textarea>
        <input [(ngModel)]="currentArticle.author" name="author" placeholder="Author" required>
        <select [(ngModel)]="currentArticle.category" name="category" required>
          <option value="">Select Category</option>
          <option value="sports">Sports</option>
          <option value="entertainment">Entertainment</option>
          <option value="technology">Technology</option>
          <option value="politics">Politics</option>
        </select>
        <input [(ngModel)]="currentArticle.thumbnail_url" name="thumbnail_url" placeholder="Thumbnail URL">
        <div class="form-actions">
          <button type="submit" class="btn-primary">{{ editingArticle?.id ? 'Update' : 'Create' }}</button>
          <button type="button" (click)="cancelEdit()" class="btn-secondary">Cancel</button>
        </div>
      </form>

      <!-- Articles List -->
      <div class="articles-list">
        <div *ngFor="let article of articles" class="article-card">
          <div class="article-header">
            <h3>{{ article.title }}</h3>
            <div class="article-meta">
              <span>By {{ article.author }}</span>
              <span>{{ article.category }}</span>
              <span>{{ article.created_at | date:'short' }}</span>
            </div>
          </div>
          
          <div class="article-body">
            {{ article.body | slice:0:200 }}{{ article.body.length > 200 ? '...' : '' }}
          </div>

          <div class="article-actions">
            <button (click)="editArticle(article)" class="btn-secondary">Edit</button>
            <button (click)="deleteArticle(article.id!)" class="btn-danger">Delete</button>
            <button (click)="showPublishModal(article)" class="btn-primary">Publish to Feed</button>
            <button (click)="checkCompliance(article)" class="btn-info">Check Compliance</button>
          </div>

          <!-- Compliance Results -->
          <div *ngIf="complianceResults[article.id!]" class="compliance-results">
            <h4>Compliance Check Results</h4>
            <div [class]="complianceResults[article.id!].passed ? 'success' : 'error'">
              Status: {{ complianceResults[article.id!].passed ? 'PASSED' : 'FAILED' }}
            </div>
            
            <div *ngIf="complianceResults[article.id!].errors.length > 0" class="errors">
              <h5>Errors:</h5>
              <ul>
                <li *ngFor="let error of complianceResults[article.id!].errors">
                  <strong>{{ error.rule }}:</strong> {{ error.message }}
                  <span *ngIf="error.field"> (Field: {{ error.field }})</span>
                </li>
              </ul>
            </div>


            <div *ngIf="complianceResults[article.id!].warnings.length > 0" class="warnings">
              <h5>Warnings:</h5>
              <ul>
                <li *ngFor="let warning of complianceResults[article.id!].warnings">
                  <strong>{{ warning.rule }}:</strong> {{ warning.message }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div *ngIf="pagination" class="pagination">
        <button (click)="goToPage(pagination.current_page - 1)" 
                [disabled]="pagination.current_page === 1">
          Prev
        </button>

        <span>Page {{ pagination.current_page }} of {{ pagination.last_page }}</span>

        <button (click)="goToPage(pagination.current_page + 1)" 
                [disabled]="pagination.current_page === pagination.last_page">
          Next
        </button>
      </div>

      <!-- Publish Modal -->
      <div *ngIf="showPublishModalFlag" class="modal-overlay" (click)="closePublishModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Publish Article: {{ selectedArticle?.title }}</h3>
          
          <div class="publish-options">
            <h4>Select Feed(s):</h4>
            <div *ngFor="let feed of feeds" class="feed-option">
              <label>
                <input type="checkbox" [(ngModel)]="selectedFeeds[feed.id!]">
                {{ feed.name }} ({{ feed.type }})
              </label>
              <button (click)="checkSingleFeedCompliance(selectedArticle!, feed)" class="btn-info btn-small">
                Check Compliance
              </button>
            </div>
          </div>

          <div class="schedule-section">
            <label>
              <input type="checkbox" [(ngModel)]="schedulePublish">
              Schedule for later
            </label>
            <input *ngIf="schedulePublish" type="datetime-local" [(ngModel)]="scheduledTime">
          </div>

          <div class="modal-actions">
            <button (click)="publishArticle()" class="btn-primary" [disabled]="!hasSelectedFeeds()">
              {{ schedulePublish ? 'Schedule' : 'Publish Now' }}
            </button>
            <button (click)="closePublishModal()" class="btn-secondary">Cancel</button>
          </div>

          <!-- Single Feed Compliance Results -->
          <div *ngIf="singleFeedCompliance" class="single-compliance">
            <h4>Compliance Check for {{ singleFeedCompliance.feedName }}</h4>
            <div [class]="singleFeedCompliance.result.passed ? 'success' : 'error'">
              {{ singleFeedCompliance.result.passed ? 'COMPLIANT' : 'NON-COMPLIANT' }}
            </div>
            <div *ngIf="singleFeedCompliance.result.errors.length > 0">
              <strong>Errors:</strong>
              <ul>
                <li *ngFor="let error of singleFeedCompliance.result.errors">{{ error.message }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading and Error States -->
      <div *ngIf="loading" class="loading">Loading...</div>
      <div *ngIf="error" class="error">{{ error }}</div>
    </div>
  `,
  styles: [`
    .articles-section { padding: 20px 0; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .article-form { background: #f9f9f9; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
    .article-form input, .article-form textarea, .article-form select { 
      width: 100%; margin-bottom: 10px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; 
    }
    .form-actions { display: flex; gap: 10px; }
    .articles-list { display: grid; gap: 20px; }
    .article-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: white; }
    .article-header h3 { margin: 0 0 10px 0; color: #333; }
    .article-meta { display: flex; gap: 15px; color: #666; font-size: 14px; }
    .article-meta span { background: #f0f0f0; padding: 2px 8px; border-radius: 4px; }
    .article-body { margin: 15px 0; line-height: 1.6; }
    .article-actions { display: flex; gap: 10px; margin-top: 15px; }
    .compliance-results { margin-top: 15px; padding: 15px; border-radius: 4px; background: #f8f9fa; }
    .compliance-results.success { border-left: 4px solid #28a745; }
    .compliance-results.error { border-left: 4px solid #dc3545; }
    .errors, .warnings { margin-top: 10px; }
    .errors ul, .warnings ul { margin: 5px 0; padding-left: 20px; }
    .errors { color: #dc3545; }
    .warnings { color: #ffc107; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; padding: 30px; border-radius: 8px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; }
    .feed-option { display: flex; align-items: center; gap: 10px; margin: 10px 0; }
    .feed-option label { flex: 1; }
    .schedule-section { margin: 20px 0; }
    .modal-actions { display: flex; gap: 10px; margin-top: 20px; }
    .single-compliance { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; }
    .btn-primary { background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    .btn-secondary { background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    .btn-danger { background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    .btn-info { background: #17a2b8; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    .btn-small { padding: 4px 8px; font-size: 12px; }
    .btn-primary:disabled { background: #ccc; cursor: not-allowed; }
    .loading { text-align: center; padding: 20px; }
    .error { color: #dc3545; text-align: center; padding: 20px; }
    .success { color: #28a745; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 20px; }
    .pagination button { background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
    .pagination button:disabled { background: #ccc; cursor: not-allowed; }
  `]
})
export class ArticlesComponent implements OnInit {
  articles: any[] = [];
  pagination: any;
  feeds: FeedConfig[] = [];
  currentArticle: Article = this.initializeArticle();
  editingArticle: Article | null = null;
  showCreateForm = false;
  showPublishModalFlag = false;
  selectedArticle: Article | null = null;
  selectedFeeds: { [key: number]: boolean } = {};
  schedulePublish = false;
  scheduledTime = '';
  complianceResults: { [key: number]: ComplianceResult } = {};
  singleFeedCompliance: { feedName: string; result: ComplianceResult } | null = null;
  loading = false;
  error = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadArticles();
    this.loadFeeds();
  }

  initializeArticle(): Article {
    return {
      title: '',
      body: '',
      author: '',
      category: '',
      thumbnail_url: ''
    };
  }

  loadArticles(page: number = 1) {
    this.loading = true;
    this.apiService.getArticles().subscribe(
      (res:any) => {
        this.articles = res.data;
        this.pagination = {
          current_page: res.current_page,
          last_page: res.last_page,
          total: res.total
        };
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load articles:', error);
        this.loading = false;
      }
    );
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.pagination.last_page) {
      this.loadArticles(page);
    }
  }

  loadFeeds() {
    this.apiService.getFeeds().subscribe({
      next: (feeds) => {
        this.feeds = feeds;
      },
      error: (err) => {
        console.error('Failed to load feeds:', err);
      }
    });
  }

  saveArticle() {
    if (this.editingArticle?.id) {
      this.apiService.updateArticle(this.editingArticle.id, this.currentArticle).subscribe({
        next: (article) => {
          const index = this.articles.findIndex(a => a.id === article.id);
          if (index >= 0) {
            this.articles[index] = article;
          }
          this.cancelEdit();
        },
        error: (err) => {
          this.error = 'Failed to update article';
          console.error(err);
        }
      });
    } else {
      this.apiService.createArticle(this.currentArticle).subscribe({
        next: (article) => {
          this.articles.unshift(article);
          this.cancelEdit();
        },
        error: (err) => {
          this.error = 'Failed to create article';
          console.error(err);
        }
      });
    }
  }

  editArticle(article: Article) {
    this.editingArticle = article;
    this.currentArticle = { ...article };
    this.showCreateForm = true;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    }); // Scroll to top when editing
  }

  deleteArticle(id: number) {
    if (confirm('Are you sure you want to delete this article?')) {
      this.apiService.deleteArticle(id).subscribe({
        next: () => {
          this.articles = this.articles.filter(a => a.id !== id);
        },
        error: (err) => {
          this.error = 'Failed to delete article';
          console.error(err);
        }
      });
    }
  }

  cancelEdit() {
    this.showCreateForm = false;
    this.editingArticle = null;
    this.currentArticle = this.initializeArticle();
    this.error = '';
  }

  showPublishModal(article: Article) {
    this.selectedArticle = article;
    this.selectedFeeds = {};
    this.showPublishModalFlag = true;
    this.singleFeedCompliance = null;
  }

  closePublishModal() {
    this.showPublishModalFlag = false;
    this.selectedArticle = null;
    this.selectedFeeds = {};
    this.schedulePublish = false;
    this.scheduledTime = '';
    this.singleFeedCompliance = null;
  }

  hasSelectedFeeds(): boolean {
    return Object.values(this.selectedFeeds).some(selected => selected);
  }

  // checkCompliance(article: Article) {
  //   if (this.feeds.length === 0) {
  //     this.error = 'No feeds available for compliance check';
  //     return;
  //   }

  //   this.feeds.forEach(feed => {
  //     if(feed.id === 6){
  //       this.apiService.checkCompliance(article.id!, feed.id!).subscribe({
  //         next: (result:any) => {
  //           if(result.overall_status == 'PASSED'){
  //             result.passed = true;
  //           }else{
  //             result.passed = false;
  //           }
  //           this.complianceResults[article.id!] = result;
  //         },
  //         error: (err) => {
  //           console.error(`Compliance check failed for feed ${feed.name}:`, err);
  //         }
  //       });
  //     }
  //   });
  // }

  checkCompliance(article: Article) {
    if (this.feeds.length === 0) {
      this.error = 'No feeds available for compliance check';
      return;
    }
  
    this.feeds.forEach(feed => {
      if(feed.id === 6){
        this.apiService.checkCompliance(article.id!, feed.id!).subscribe({
          next: (result:any) => {
            result.passed = result.overall_status === 'PASSED';
  
            // 🔥 transform results object into errors/warnings arrays
            result.errors = Object.values(result.results || {})
              .filter((r: any) => !r.passed)
              .map((r: any) => ({
                rule: r.rule,
                message: r.message,
                field: r.details?.field || null
              }));
  
            result.warnings = Object.values(result.results || {})
              .filter((r: any) => r.passed && r.details?.issues?.length > 0)
              .map((r: any) => ({
                rule: r.rule,
                message: r.details.issues.join(', ')
              }));
  
            this.complianceResults[article.id!] = result;
          },
          error: (err) => {
            console.error(`Compliance check failed for feed ${feed.name}:`, err);
          }
        });
      }
    });
  }

  checkSingleFeedCompliance(article: Article, feed: FeedConfig) {
    if(feed.id === 6){
      this.apiService.checkCompliance(article.id!, feed.id!).subscribe({
        next: (result:any) => {
          if(result.overall_status == 'PASSED'){
            result.passed = true;
          }else{
            result.passed = false;
          }
          this.singleFeedCompliance = {
            feedName: feed.name,
            result: result
          };
        },
        error: (err) => {
          this.error = `Compliance check failed for ${feed.name}`;
          console.error(err);
        }
      });
    }
  }

  publishArticle() {
    if (!this.selectedArticle) return;

    const selectedFeedIds = Object.entries(this.selectedFeeds)
      .filter(([_, selected]) => selected)
      .map(([feedId, _]) => parseInt(feedId));

    if (selectedFeedIds.length === 0) {
      this.error = 'Please select at least one feed';
      return;
    }

    const publishRequests: PublishRequest[] = selectedFeedIds.map(feedId => ({
      feed_id: feedId,
      scheduled_at: this.schedulePublish ? this.scheduledTime : undefined
    }));

    if (publishRequests.length === 1) {
      this.apiService.publishToFeed(this.selectedArticle.id!, publishRequests[0]).subscribe({
        next: (result) => {
          this.handlePublishResult(result);
        },
        error: (err) => {
          this.error = 'Failed to publish article';
          console.error(err);
        }
      });
    } else {
      this.apiService.publishToMultipleFeeds(this.selectedArticle.id!, publishRequests).subscribe({
        next: (results) => {
          this.handleMultiplePublishResults(results);
        },
        error: (err) => {
          this.error = 'Failed to publish article to multiple feeds';
          console.error(err);
        }
      });
    }
  }

  handlePublishResult(result: ComplianceResult) {
    if (result.success) {
      alert('Article published successfully!');
      this.closePublishModal();
    } else {
      this.error = 'Article failed compliance checks and was not published';
      this.complianceResults[this.selectedArticle!.id!] = result;
    }
  }

  handleMultiplePublishResults(results: ComplianceResult[]) {
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    if (passedCount === totalCount) {
      alert(`Article published to all ${totalCount} feeds successfully!`);
      this.closePublishModal();
    } else if (passedCount > 0) {
      alert(`Article published to ${passedCount} out of ${totalCount} feeds. Some failed compliance checks.`);
    } else {
      this.error = 'Article failed compliance checks for all feeds and was not published';
    }
  }
}
