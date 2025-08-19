import { Injectable } from '@angular/core';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  article_id: number;
  feed_id: number;
  action: 'compliance_check' | 'publish_attempt' | 'publish_success' | 'publish_failure';
  result: any;
  user_id?: number;
  metadata?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private auditLog: AuditLogEntry[] = [];

  constructor() {
    // Load from localStorage if available (for demo purposes)
    const stored = localStorage.getItem('compliance_audit_log');
    if (stored) {
      try {
        this.auditLog = JSON.parse(stored).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
      } catch (e) {
        console.warn('Failed to load audit log from localStorage');
      }
    }
  }

  logComplianceCheck(articleId: number, feedId: number, result: any, metadata?: any): string {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      article_id: articleId,
      feed_id: feedId,
      action: 'compliance_check',
      result: result,
      metadata: metadata
    };

    this.auditLog.unshift(entry);
    this.persistAuditLog();
    return entry.id;
  }

  logPublishAttempt(articleId: number, feedId: number, success: boolean, result: any, metadata?: any): string {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      article_id: articleId,
      feed_id: feedId,
      action: success ? 'publish_success' : 'publish_failure',
      result: result,
      metadata: metadata
    };

    this.auditLog.unshift(entry);
    this.persistAuditLog();
    return entry.id;
  }

  getAuditLog(limit: number = 100): AuditLogEntry[] {
    return this.auditLog.slice(0, limit);
  }

  getAuditLogForArticle(articleId: number): AuditLogEntry[] {
    return this.auditLog.filter(entry => entry.article_id === articleId);
  }

  getAuditLogForFeed(feedId: number): AuditLogEntry[] {
    return this.auditLog.filter(entry => entry.feed_id === feedId);
  }

  private persistAuditLog() {
    try {
      // Keep only last 1000 entries to prevent localStorage bloat
      const toStore = this.auditLog.slice(0, 1000);
      localStorage.setItem('compliance_audit_log', JSON.stringify(toStore));
    } catch (e) {
      console.warn('Failed to persist audit log to localStorage');
    }
  }

  clearAuditLog() {
    this.auditLog = [];
    localStorage.removeItem('compliance_audit_log');
  }
}