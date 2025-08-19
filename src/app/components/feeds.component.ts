import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { FeedConfig, FeedStats } from '../models/feed.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feeds',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="feeds-section">
      

      <!-- Create/Edit Feed Form -->
      <form *ngIf="showCreateForm" (ngSubmit)="saveFeed()" class="feed-form">
        <h3>{{ editingFeed?.id ? 'Edit' : 'Create' }} Feed</h3>

        <input
          [(ngModel)]="currentFeed.name"
          name="name"
          placeholder="Feed Name"
          required
        />

        <select [(ngModel)]="currentFeed.type" name="type" required>
          <option value="">Select Feed Type</option>
          <option value="MSN">MSN</option>
          <option value="Google News">Google News</option>
          <option value="Apple News">Apple News</option>
          <option value="RSS">RSS</option>
        </select>

        <label>
          <input
            type="checkbox"
            [(ngModel)]="currentFeed.is_active"
            name="is_active"
          />
          Active
        </label>

        <h4>Guidelines Configuration</h4>
        <div class="guidelines-grid">
          <input
            [(ngModel)]="currentFeed.guidelines.title_min_length"
            name="title_min_length"
            type="number"
            placeholder="Title Min Length"
          />
          <input
            [(ngModel)]="currentFeed.guidelines.title_max_length"
            name="title_max_length"
            type="number"
            placeholder="Title Max Length"
          />
          <input
            [(ngModel)]="currentFeed.guidelines.body_min_length"
            name="body_min_length"
            type="number"
            placeholder="Body Min Length"
          />
          <input
            [(ngModel)]="currentFeed.guidelines.body_max_length"
            name="body_max_length"
            type="number"
            placeholder="Body Max Length"
          />
        </div>

        <textarea
          [(ngModel)]="prohibitedTopicsText"
          name="prohibited_topics"
          placeholder="Prohibited topics (comma-separated)"
          rows="3"
        ></textarea>

        <textarea
          [(ngModel)]="requiredFieldsText"
          name="required_fields"
          placeholder="Required fields (comma-separated)"
          rows="2"
        ></textarea>

        <textarea
          [(ngModel)]="allowedCategoriesText"
          name="allowed_categories"
          placeholder="Allowed categories (comma-separated)"
          rows="2"
        ></textarea>

        <label>
          <input
            type="checkbox"
            [(ngModel)]="currentFeed.guidelines.thumbnail_required"
            name="thumbnail_required"
          />
          Thumbnail Required
        </label>

        <div class="form-actions">
          <button type="submit" class="btn-primary">
            {{ editingFeed?.id ? 'Update' : 'Create' }}
          </button>
          <button
            type="button"
            (click)="cancelFeedEdit()"
            class="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>

      <!-- Feeds List -->
      <div class="feeds-list">
        <div *ngFor="let feed of feeds" class="feed-card">
          <div class="feed-header">
            <h3>{{ feed.name }}</h3>
            <div class="feed-meta">
              <span
                [class]="feed.is_active ? 'status-active' : 'status-inactive'"
              >
                {{ feed.is_active ? 'Active' : 'Inactive' }}
              </span>
              <span class="feed-type">{{ feed.type }}</span>
            </div>
          </div>

          <div class="feed-guidelines">
            <h4>Guidelines Summary:</h4>
            <div class="guidelines-summary">
              <span *ngIf="feed.guidelines.title_max_length">
                Title: max {{ feed.guidelines.title_max_length }} chars
              </span>
              <span *ngIf="feed.guidelines.body_max_length">
                Body: max {{ feed.guidelines.body_max_length }} chars
              </span>
              <span *ngIf="feed.guidelines.thumbnail_required">
                Thumbnail required
              </span>
              <span *ngIf="feed.guidelines.prohibited_topics?.length">
                {{ feed.guidelines.prohibited_topics?.length }} prohibited
                topics
              </span>
            </div>
          </div>

          <div class="feed-stats" *ngIf="feedStats[feed.id!]">
            <h4>Statistics:</h4>
            <div class="stats-grid">
              <div class="stat">
                <label>Total Published:</label>
                <span>{{ feedStats[feed.id!].total_published }}</span>
              </div>
              <div class="stat">
                <label>Success Rate:</label>
                <span
                  >{{
                    (feedStats[feed.id!].success_rate * 100).toFixed(1)
                  }}%</span
                >
              </div>
              <div class="stat">
                <label>Last 24h Published:</label>
                <span>{{ feedStats[feed.id!].last_24h_published }}</span>
              </div>
              <div class="stat">
                <label>Last 24h Failed:</label>
                <span>{{ feedStats[feed.id!].last_24h_failed }}</span>
              </div>
            </div>
          </div>

          <div class="feed-actions">
            <button (click)="editFeed(feed)" class="btn-secondary">Edit</button>
            <button (click)="deleteFeed(feed.id!)" class="btn-danger">
              Delete
            </button>
            <button (click)="loadFeedStats(feed.id!)" class="btn-info">
              Load Stats
            </button>
            <button (click)="toggleFeedStatus(feed)" class="btn-primary">
              {{ feed.is_active ? 'Deactivate' : 'Activate' }}
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="loading">Loading...</div>
      <div *ngIf="error" class="error">{{ error }}</div>
    </div>
  `,
  styles: [
    `
      .feeds-section {
        padding: 20px 0;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .feed-form {
        background: #f9f9f9;
        padding: 20px;
        margin-bottom: 20px;
        border-radius: 8px;
      }
      .feed-form input,
      .feed-form textarea,
      .feed-form select {
        width: 100%;
        margin-bottom: 10px;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .guidelines-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 10px;
      }
      .form-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
      }
      .feeds-list {
        display: grid;
        gap: 20px;
      }
      .feed-card {
        border: 1px solid #ddd;
        padding: 20px;
        border-radius: 8px;
        background: white;
      }
      .feed-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }
      .feed-header h3 {
        margin: 0;
        color: #333;
      }
      .feed-meta {
        display: flex;
        gap: 10px;
      }
      .status-active {
        background: #28a745;
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
      }
      .status-inactive {
        background: #dc3545;
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
      }
      .feed-type {
        background: #17a2b8;
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
      }
      .guidelines-summary {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 5px;
      }
      .guidelines-summary span {
        background: #f0f0f0;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
      }
      .feed-stats {
        margin: 15px 0;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
      }
      .stat {
        display: flex;
        justify-content: space-between;
        padding: 8px;
        background: #f8f9fa;
        border-radius: 4px;
      }
      .stat label {
        font-weight: bold;
      }
      .feed-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
      }
      .btn-primary {
        background: #007bff;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      }
      .btn-secondary {
        background: #6c757d;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      }
      .btn-danger {
        background: #dc3545;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      }
      .btn-info {
        background: #17a2b8;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      }
      .loading {
        text-align: center;
        padding: 20px;
      }
      .error {
        color: #dc3545;
        text-align: center;
        padding: 20px;
      }
    `,
  ],
})
export class FeedsComponent implements OnInit {
  feeds: FeedConfig[] = [];
  currentFeed: FeedConfig = this.initializeFeed();
  editingFeed: FeedConfig | null = null;
  showCreateForm = false;
  feedStats: { [key: number]: FeedStats } = {};
  loading = false;
  error = '';

  // Helper properties for form binding
  prohibitedTopicsText = '';
  requiredFieldsText = '';
  allowedCategoriesText = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadFeeds();
  }

  initializeFeed(): FeedConfig {
    return {
      name: '',
      type: '',
      is_active: true,
      guidelines: {},
      publish_attempts: [],
    };
  }

  loadFeeds() {
    this.loading = true;
    this.apiService.getFeeds().subscribe({
      next: (feeds) => {
        this.feeds = feeds;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load feeds';
        this.loading = false;
        console.error(err);
      },
    });
  }

  // saveFeed() {
  //   // Parse comma-separated strings back to arrays
  //   this.currentFeed.guidelines.prohibited_topics = this.prohibitedTopicsText
  //     .split(',')
  //     .map((s) => s.trim())
  //     .filter((s) => s.length > 0);
  //   this.currentFeed.guidelines.required_fields = this.requiredFieldsText
  //     .split(',')
  //     .map((s) => s.trim())
  //     .filter((s) => s.length > 0);
  //   this.currentFeed.guidelines.allowed_categories = this.allowedCategoriesText
  //     .split(',')
  //     .map((s) => s.trim())
  //     .filter((s) => s.length > 0);

  //   if (this.editingFeed?.id) {
  //     this.apiService
  //       .updateFeed(this.editingFeed.id, this.currentFeed)
  //       .subscribe({
  //         next: (feed) => {
  //           const index = this.feeds.findIndex((f) => f.id === feed.id);
  //           if (index >= 0) {
  //             this.feeds[index] = feed;
  //           }
  //           this.cancelFeedEdit();
  //         },
  //         error: (err) => {
  //           this.error = 'Failed to update feed';
  //           console.error(err);
  //         },
  //       });
  //   } else {
  //     this.apiService.createFeed(this.currentFeed).subscribe({
  //       next: (feed) => {
  //         this.feeds.unshift(feed);
  //         this.cancelFeedEdit();
  //       },
  //       error: (err) => {
  //         this.error = 'Failed to create feed';
  //         console.error(err);
  //       },
  //     });
  //   }
  // }


  saveFeed() {
    // Make sure api_specifications exists
    if (!this.currentFeed.guidelines.api_specifications) {
      this.currentFeed.guidelines.api_specifications = {};
    }
  
    // Parse comma-separated strings back to arrays
    this.currentFeed.guidelines.api_specifications.prohibited_terms =
      this.prohibitedTopicsText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
  
    this.currentFeed.guidelines.api_specifications.required_fields =
      this.requiredFieldsText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
  
    this.currentFeed.guidelines.api_specifications.allowed_categories =
      this.allowedCategoriesText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
  
    // Save title/body lengths
    this.currentFeed.guidelines.api_specifications.title_min_length =
      this.currentFeed.guidelines.title_min_length || null;
  
    this.currentFeed.guidelines.api_specifications.title_max_length =
      this.currentFeed.guidelines.title_max_length || null;
  
    this.currentFeed.guidelines.api_specifications.content_min_length =
      this.currentFeed.guidelines.body_min_length || null;
  
    this.currentFeed.guidelines.api_specifications.content_max_length =
      this.currentFeed.guidelines.body_max_length || null;
  
    // Call API
    if (this.editingFeed?.id) {
      this.apiService
        .updateFeed(this.editingFeed.id, this.currentFeed)
        .subscribe({
          next: (feed) => {
            const index = this.feeds.findIndex((f) => f.id === feed.id);
            console.log('Updated feed:', feed);
            if (index >= 0) {
              this.feeds[index] = feed;
            }
            this.cancelFeedEdit();
          },
          error: (err) => {
            this.error = 'Failed to update feed';
            console.error(err);
          },
        });
    } else {
      this.apiService.createFeed(this.currentFeed).subscribe({
        next: (feed) => {
          this.feeds.unshift(feed);
          this.cancelFeedEdit();
        },
        error: (err) => {
          this.error = 'Failed to create feed';
          console.error(err);
        },
      });
    }
  }
  

  editFeed(feed: FeedConfig) {
    this.editingFeed = feed;
  this.currentFeed = { ...feed, guidelines: { ...feed.guidelines } };

  const apiSpec = feed.guidelines.api_specifications || {};

  // Convert arrays to comma-separated strings
  this.prohibitedTopicsText = apiSpec.prohibited_terms?.join(', ') || '';
  this.requiredFieldsText = apiSpec.required_fields?.join(', ') || '';
  this.allowedCategoriesText = apiSpec.allowed_categories?.join(', ') || '';

  // Map title/body length fields
  this.currentFeed.guidelines.title_min_length = apiSpec.title_min_length || null;
  this.currentFeed.guidelines.title_max_length = apiSpec.title_max_length || null;
  this.currentFeed.guidelines.body_min_length = apiSpec.content_min_length || null;
  this.currentFeed.guidelines.body_max_length = apiSpec.content_max_length || null;

  this.showCreateForm = true;

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "smooth"
  }); // Scroll to top when editing
  }

  deleteFeed(id: number) {
    if (confirm('Are you sure you want to delete this feed?')) {
      this.apiService.deleteFeed(id).subscribe({
        next: () => {
          this.feeds = this.feeds.filter((f) => f.id !== id);
          delete this.feedStats[id];
        },
        error: (err) => {
          this.error = 'Failed to delete feed';
          console.error(err);
        },
      });
    }
  }

  cancelFeedEdit() {
    this.showCreateForm = false;
    this.editingFeed = null;
    this.currentFeed = this.initializeFeed();
    this.prohibitedTopicsText = '';
    this.requiredFieldsText = '';
    this.allowedCategoriesText = '';
    this.error = '';
  }

  loadFeedStats(feedId: number) {
    this.apiService.getFeedStats(feedId).subscribe({
      next: (stats) => {
        this.feedStats[feedId] = stats;
      },
      error: (err) => {
        this.error = `Failed to load stats for feed ${feedId}`;
        console.error(err);
      },
    });
  }

  toggleFeedStatus(feed: FeedConfig) {
    const updatedFeed = { ...feed, is_active: !feed.is_active };
    this.apiService.updateFeed(feed.id!, updatedFeed).subscribe({
      next: (updated) => {
        const index = this.feeds.findIndex((f) => f.id === updated.id);
        if (index >= 0) {
          this.feeds[index] = updated;
        }
      },
      error: (err) => {
        this.error = 'Failed to update feed status';
        console.error(err);
      },
    });
  }
}


// <div class="header">
//         <h2>Feed Management</h2>
//         <button (click)="showCreateForm = !showCreateForm" class="btn-primary">
//           {{ showCreateForm ? 'Cancel' : 'Create Feed' }}
//         </button>
//       </div>
