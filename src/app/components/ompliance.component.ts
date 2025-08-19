import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ComplianceRule, ValidatorType } from '../models/compliance.model';
import { FeedConfig } from '../models/feed.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-compliance',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="compliance-section">
      <div class="header">
        <h2>Compliance Rules Management</h2>
        <button (click)="showCreateForm = !showCreateForm" class="btn-primary">
          {{ showCreateForm ? 'Cancel' : 'Create Rule' }}
        </button>
      </div>

      <!-- Create/Edit Rule Form -->
      <form *ngIf="showCreateForm" (ngSubmit)="saveRule()" class="rule-form">
        <h3>{{ editingRule?.id ? 'Edit' : 'Create' }} Compliance Rule</h3>
        
        <input [(ngModel)]="currentRule.name" name="name" placeholder="Rule Name" required>
        <textarea [(ngModel)]="currentRule.description" name="description" placeholder="Description" rows="3" required></textarea>
        
        <select [(ngModel)]="currentRule.feed_id" name="feed_id" required>
          <option value="">Select Feed</option>
          <option *ngFor="let feed of feeds" [value]="feed.id">{{ feed.name }}</option>
        </select>

        <select [(ngModel)]="currentRule.validator_class" name="validator_class" required (change)="onValidatorTypeChange()">
          <option value="">Select Validator Type</option>
          <option *ngFor="let validator of validatorTypes" [value]="validator">
            {{ validator }}
          </option>
        </select>

        <label>
          <input type="checkbox" [(ngModel)]="currentRule.is_active" name="is_active">
          Active
        </label>

        <!-- Dynamic Configuration Based on Validator Type -->
        <div *ngIf="currentRule.validator_type" class="validator-config">
          <h4>Validator Configuration:</h4>
          <div [ngSwitch]="currentRule.validator_type">
            
            <!-- Length Validator Config -->
            <div *ngSwitchCase="'length'">
              <select [(ngModel)]="lengthConfig.field" name="field">
                <option value="title">Title</option>
                <option value="body">Body</option>
              </select>
              <input [(ngModel)]="lengthConfig.min_length" name="min_length" type="number" placeholder="Min Length">
              <input [(ngModel)]="lengthConfig.max_length" name="max_length" type="number" placeholder="Max Length">
            </div>

            <!-- Required Fields Validator Config -->
            <div *ngSwitchCase="'required_fields'">
              <textarea [(ngModel)]="requiredFieldsConfigText" name="required_fields" 
                        placeholder="Required fields (comma-separated)" rows="2"></textarea>
            </div>

            <!-- Prohibited Content Validator Config -->
            <div *ngSwitchCase="'prohibited_content'">
              <textarea [(ngModel)]="prohibitedContentConfigText" name="prohibited_content" 
                        placeholder="Prohibited keywords/topics (comma-separated)" rows="3"></textarea>
              <label>
                <input type="checkbox" [(ngModel)]="prohibitedContentConfig.case_sensitive">
                Case Sensitive
              </label>
            </div>

            <!-- Category Validator Config -->
            <div *ngSwitchCase="'category'">
              <textarea [(ngModel)]="allowedCategoriesConfigText" name="allowed_categories" 
                        placeholder="Allowed categories (comma-separated)" rows="2"></textarea>
            </div>

            <!-- Metadata Validator Config -->
            <div *ngSwitchCase="'metadata'">
              <textarea [(ngModel)]="metadataConfigText" name="metadata_fields" 
                        placeholder="Required metadata fields (comma-separated)" rows="2"></textarea>
            </div>

            <!-- Custom JSON Config -->
            <div *ngSwitchDefault>
              <textarea [(ngModel)]="customConfigText" name="custom_config" 
                        placeholder="Custom configuration (JSON)" rows="5"></textarea>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary">{{ editingRule?.id ? 'Update' : 'Create' }}</button>
          <button type="button" (click)="cancelRuleEdit()" class="btn-secondary">Cancel</button>
        </div>
      </form>

      <!-- Rules List -->
      <div class="rules-list">
        <div *ngFor="let rule of complianceRules" class="rule-card">
          <div class="rule-header">
            <h3>{{ rule.name }}</h3>
            <div class="rule-meta">
              <span [class]="rule.is_active ? 'status-active' : 'status-inactive'">
                {{ rule.is_active ? 'Active' : 'Inactive' }}
              </span>

              <span class="validator-type">{{ rule.validator_type }}</span>
            </div>
          </div>

          <p class="rule-description">{{ rule.description }}</p>
          
          <div class="rule-details">
            <div class="detail-item">
              <strong>Feed:</strong> 
              <span>{{ getFeedName(rule.feed_id) }}</span>
            </div>
            <div class="detail-item">
              <strong>Configuration:</strong>
              <pre>{{ formatConfiguration(rule.configuration) }}</pre>
            </div>
          </div>

          <div class="rule-actions">
            <button (click)="editRule(rule)" class="btn-secondary">Edit</button>
            <button (click)="toggleRuleStatus(rule)" class="btn-primary">
              {{ rule.is_active ? 'Deactivate' : 'Activate' }}
            </button>
            <button (click)="testRule(rule)" class="btn-info">Test Rule</button>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="loading">Loading...</div>
      <div *ngIf="error" class="error">{{ error }}</div>
    </div>
  `,
  styles: [`
    .compliance-section { padding: 20px 0; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .rule-form { background: #f9f9f9; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
    .rule-form input, .rule-form textarea, .rule-form select { 
      width: 100%; margin-bottom: 10px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; 
    }
    .validator-config { margin-top: 15px; padding: 15px; background: #fff; border-radius: 4px; border: 1px solid #ddd; }
    .form-actions { display: flex; gap: 10px; margin-top: 15px; }
    .rules-list { display: grid; gap: 20px; }
    .rule-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: white; }
    .rule-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .rule-header h3 { margin: 0; color: #333; }
    .rule-meta { display: flex; gap: 10px; }
    .status-active { background: #28a745; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .status-inactive { background: #dc3545; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .severity-error { background: #dc3545; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .severity-warning { background: #ffc107; color: black; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .validator-type { background: #17a2b8; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .rule-description { color: #666; margin: 10px 0; }
    .rule-details { margin: 15px 0; }
    .detail-item { margin: 5px 0; }
    .detail-item pre { background: #f8f9fa; padding: 8px; border-radius: 4px; margin: 5px 0; font-size: 12px; }
    .rule-actions { display: flex; gap: 10px; margin-top: 15px; }
    .btn-primary { background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    .btn-secondary { background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    .btn-info { background: #17a2b8; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    .loading { text-align: center; padding: 20px; }
    .error { color: #dc3545; text-align: center; padding: 20px; }
  `]
})
export class ComplianceComponent implements OnInit {
  complianceRules: ComplianceRule[] = [];
  feeds: FeedConfig[] = [];
  validatorTypes: ValidatorType[] = [];
  currentRule: ComplianceRule = this.initializeRule();
  editingRule: ComplianceRule | null = null;
  showCreateForm = false;
  loading = false;
  error = '';

  // Configuration helpers for different validator types
  lengthConfig: any = {};
  prohibitedContentConfig: any = {};
  requiredFieldsConfigText = '';
  prohibitedContentConfigText = '';
  allowedCategoriesConfigText = '';
  metadataConfigText = '';
  customConfigText = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadComplianceRules();
    this.loadFeeds();
    this.loadValidatorTypes();
  }

  initializeRule(): ComplianceRule {
    return {
      name: '',
      description: '',
      feed_id: 0,
      validator_type: '',
      configuration: {},
      is_active: true,
      severity: 'error'
    };
  }

  loadComplianceRules() {
    this.loading = true;
    this.apiService.getComplianceRules().subscribe({
      next: (rules) => {
        this.complianceRules = rules;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load compliance rules';
        this.loading = false;
        console.error(err);
      }
    });
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

  loadValidatorTypes() {
    this.apiService.getAvailableValidators().subscribe({
      next: (validators:any) => {
        this.validatorTypes = validators.validators;
      },
      error: (err) => {
        console.error('Failed to load validator types:', err);
      }
    });
  }

  onValidatorTypeChange() {
    // Reset configuration when validator type changes
    this.lengthConfig = {};
    this.prohibitedContentConfig = {};
    this.requiredFieldsConfigText = '';
    this.prohibitedContentConfigText = '';
    this.allowedCategoriesConfigText = '';
    this.metadataConfigText = '';
    this.customConfigText = '';
  }

  saveRule() {
    // Build configuration based on validator type
    switch (this.currentRule.validator_type) {
      case 'length':
        this.currentRule.configuration = { ...this.lengthConfig };
        break;
      case 'required_fields':
        this.currentRule.configuration = {
          fields: this.requiredFieldsConfigText.split(',').map(s => s.trim()).filter(s => s.length > 0)
        };
        break;
      case 'prohibited_content':
        this.currentRule.configuration = {
          ...this.prohibitedContentConfig,
          keywords: this.prohibitedContentConfigText.split(',').map(s => s.trim()).filter(s => s.length > 0)
        };
        break;
      case 'category':
        this.currentRule.configuration = {
          allowed_categories: this.allowedCategoriesConfigText.split(',').map(s => s.trim()).filter(s => s.length > 0)
        };
        break;
      case 'metadata':
        this.currentRule.configuration = {
          required_fields: this.metadataConfigText.split(',').map(s => s.trim()).filter(s => s.length > 0)
        };
        break;
      default:
        try {
          this.currentRule.configuration = this.customConfigText ? JSON.parse(this.customConfigText) : {};
        } catch (e) {
          this.error = 'Invalid JSON in custom configuration';
          return;
        }
    }

    if (this.editingRule?.id) {
      this.apiService.updateComplianceRule(this.editingRule.id, this.currentRule).subscribe({
        next: (rule) => {
          const index = this.complianceRules.findIndex(r => r.id === rule.id);
          if (index >= 0) {
            this.complianceRules[index] = rule;
          }
          this.cancelRuleEdit();
        },
        error: (err) => {
          this.error = 'Failed to update rule';
          console.error(err);
        }
      });
    } else {
      this.apiService.createComplianceRule(this.currentRule).subscribe({
        next: (rule) => {
          this.complianceRules.unshift(rule);
          this.cancelRuleEdit();
        },
        error: (err) => {
          this.error = 'Failed to create rule';
          console.error(err);
        }
      });
    }
  }

  editRule(rule: ComplianceRule) {
    this.editingRule = rule;
    this.currentRule = { ...rule, configuration: { ...rule.configuration } };
    
    // Populate form fields based on validator type and configuration
    switch (rule.validator_type) {
      case 'length':
        this.lengthConfig = { ...rule.configuration };
        break;
      case 'required_fields':
        this.requiredFieldsConfigText = rule.configuration.fields?.join(', ') || '';
        break;
      case 'prohibited_content':
        this.prohibitedContentConfig = { ...rule.configuration };
        this.prohibitedContentConfigText = rule.configuration.keywords?.join(', ') || '';
        break;
      case 'category':
        this.allowedCategoriesConfigText = rule.configuration.allowed_categories?.join(', ') || '';
        break;
      case 'metadata':
        this.metadataConfigText = rule.configuration.required_fields?.join(', ') || '';
        break;
      default:
        this.customConfigText = JSON.stringify(rule.configuration, null, 2);
    }
    
    this.showCreateForm = true;
  }

  cancelRuleEdit() {
    this.showCreateForm = false;
    this.editingRule = null;
    this.currentRule = this.initializeRule();
    this.onValidatorTypeChange(); // Reset all config fields
    this.error = '';
  }

  toggleRuleStatus(rule: ComplianceRule) {
    const updatedRule = { ...rule, is_active: !rule.is_active };
    this.apiService.updateComplianceRule(rule.id!, updatedRule).subscribe({
      next: (updated) => {
        const index = this.complianceRules.findIndex(r => r.id === updated.id);
        if (index >= 0) {
          this.complianceRules[index] = updated;
        }
      },
      error: (err) => {
        this.error = 'Failed to update rule status';
        console.error(err);
      }
    });
  }

  testRule(rule: ComplianceRule) {
    // This would ideally trigger a test endpoint on the backend
    alert(`Testing rule: ${rule.name}\n\nThis would run the validator against sample data to verify it works correctly.`);
  }

  getFeedName(feedId: number): string {
    const feed = this.feeds.find(f => f.id === feedId);
    return feed ? feed.name : 'Unknown Feed';
  }

  formatConfiguration(config: any): string {
    return JSON.stringify(config, null, 2);
  }

  // <span [class]="'severity-' + rule.severity">{{ rule.priority.toUpperCase() }}</span>
}