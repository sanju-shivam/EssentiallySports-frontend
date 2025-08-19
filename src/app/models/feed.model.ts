export interface FeedConfig {
    id?: number;
    name: string;
    type: string;
    guidelines: any;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    publish_attempts: any
  }
  
  
  export interface FeedStats {
    total_published: number;
    success_rate: number;
    last_24h_published: number;
    last_24h_failed: number;
    common_failures: Array<{rule: string; count: number}>;
  }