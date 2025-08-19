import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ComplianceResult, ComplianceError, ComplianceWarning } from '../models/compliance.model';
import { Article } from '../models/article.model';
import { FeedConfig } from '../models/feed.model';

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  private complianceCache = new Map<string, ComplianceResult>();
  private complianceSubject = new BehaviorSubject<{ [key: string]: ComplianceResult }>({});
  
  complianceResults$ = this.complianceSubject.asObservable();

  constructor() {}

  // Client-side validation helpers
  validateArticleLength(article: Article, minLength?: number, maxLength?: number): ComplianceError[] {
    const errors: ComplianceError[] = [];
    
    if (minLength && article.body.length < minLength) {
      errors.push({
        rule: 'body_min_length',
        message: `Article body must be at least ${minLength} characters. Current: ${article.body.length}`,
        field: 'body',
        value: article.body.length
      });
    }
    
    if (maxLength && article.body.length > maxLength) {
      errors.push({
        rule: 'body_max_length',
        message: `Article body must not exceed ${maxLength} characters. Current: ${article.body.length}`,
        field: 'body',
        value: article.body.length
      });
    }
    
    return errors;
  }

  validateTitleLength(article: Article, minLength?: number, maxLength?: number): ComplianceError[] {
    const errors: ComplianceError[] = [];
    
    if (minLength && article.title.length < minLength) {
      errors.push({
        rule: 'title_min_length',
        message: `Title must be at least ${minLength} characters. Current: ${article.title.length}`,
        field: 'title',
        value: article.title.length
      });
    }
    
    if (maxLength && article.title.length > maxLength) {
      errors.push({
        rule: 'title_max_length',
        message: `Title must not exceed ${maxLength} characters. Current: ${article.title.length}`,
        field: 'title',
        value: article.title.length
      });
    }
    
    return errors;
  }

  validateRequiredFields(article: Article, requiredFields: string[]): ComplianceError[] {
    const errors: ComplianceError[] = [];
    
    requiredFields.forEach(field => {
      const value = (article as any)[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push({
          rule: 'required_field',
          message: `Required field '${field}' is missing or empty`,
          field: field,
          value: value
        });
      }
    });
    
    return errors;
  }

  validateProhibitedContent(article: Article, prohibitedTopics: string[]): ComplianceError[] {
    const errors: ComplianceError[] = [];
    const content = (article.title + ' ' + article.body).toLowerCase();
    
    prohibitedTopics.forEach(topic => {
      if (content.includes(topic.toLowerCase())) {
        errors.push({
          rule: 'prohibited_content',
          message: `Article contains prohibited topic: '${topic}'`,
          field: 'content',
          value: topic
        });
      }
    });
    
    return errors;
  }

  validateCategory(article: Article, allowedCategories: string[]): ComplianceError[] {
    const errors: ComplianceError[] = [];
    
    if (!allowedCategories.includes(article.category)) {
      errors.push({
        rule: 'invalid_category',
        message: `Category '${article.category}' is not allowed. Allowed: ${allowedCategories.join(', ')}`,
        field: 'category',
        value: article.category
      });
    }
    
    return errors;
  }

  // Client-side pre-validation before API call
  preValidateArticle(article: Article, feed: FeedConfig): ComplianceResult {
    const errors: ComplianceError[] = [];
    const warnings: ComplianceWarning[] = [];

    // Title length validation
    errors.push(...this.validateTitleLength(
      article, 
      feed.guidelines.title_min_length, 
      feed.guidelines.title_max_length
    ));

    // Body length validation
    errors.push(...this.validateArticleLength(
      article,
      feed.guidelines.body_min_length,
      feed.guidelines.body_max_length
    ));

    // Required fields validation
    if (feed.guidelines.required_fields) {
      errors.push(...this.validateRequiredFields(article, feed.guidelines.required_fields));
    }

    // Prohibited content validation
    if (feed.guidelines.prohibited_topics) {
      errors.push(...this.validateProhibitedContent(article, feed.guidelines.prohibited_topics));
    }

    // Category validation
    if (feed.guidelines.allowed_categories) {
      errors.push(...this.validateCategory(article, feed.guidelines.allowed_categories));
    }

    // Thumbnail validation
    if (feed.guidelines.thumbnail_required && !article.thumbnail_url) {
      errors.push({
        rule: 'thumbnail_required',
        message: 'Thumbnail is required for this feed',
        field: 'thumbnail',
        value: null
      });
    }

    return {
      passed: errors.length === 0,
      errors: errors,
      warnings: warnings,
      audit_log_id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  cacheComplianceResult(articleId: number, feedId: number, result: ComplianceResult) {
    const key = `${articleId}-${feedId}`;
    this.complianceCache.set(key, result);
    
    const current = this.complianceSubject.value;
    this.complianceSubject.next({
      ...current,
      [key]: result
    });
  }

  getCachedComplianceResult(articleId: number, feedId: number): ComplianceResult | null {
    const key = `${articleId}-${feedId}`;
    return this.complianceCache.get(key) || null;
  }
}