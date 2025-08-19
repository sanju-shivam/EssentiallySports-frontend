export interface ComplianceRule {
    id?: number;
    name: string;
    description: string;
    feed_id: number;
    validator_type: string;
    configuration: any;
    is_active: boolean;
    severity: 'error' | 'warning';
    created_at?: string;
    updated_at?: string;
    validator_class?: string;
  }
  
  export interface ValidatorType {
    name: string;
    description: string;
    configuration_schema: any;
  }
  
  export interface SystemHealth {
    overall_status: 'healthy' | 'warning' | 'critical';
    components: {
      [key: string]: {
        status: 'healthy' | 'warning' | 'critical';
        message: string;
        last_check: string;
      }
    };
  }