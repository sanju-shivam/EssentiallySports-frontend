export interface Article {
    id?: number;
    title: string;
    body: string;
    author: string;
    category: string;
    thumbnail_url?: string;
    metadata?: any;
    created_at?: string;
    updated_at?: string;
  }
  
  export interface PublishRequest {
    feed_id: number;
    scheduled_at?: string;
  }
  
  export interface ComplianceResult {
    passed: boolean;
    errors: ComplianceError[];
    warnings: ComplianceWarning[];
    audit_log_id: string;
    success: string ;
  }
  
  export interface ComplianceError {
    rule: string;
    message: string;
    field?: string;
    value?: any;
  }
  
  export interface ComplianceWarning {
    rule: string;
    message: string;
    field?: string;
  }