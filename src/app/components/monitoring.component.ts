import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';

interface SystemHealth {
  overall_status: string;
  issues: {
    type: string;
    feed: string;
    success_rate: number;
    message: string;
  }[];
  metrics: {
    [feed: string]: {
      total_attempts: number;
      successful_attempts: number;
      success_rate: number;
    };
  };
}

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="monitoring-section">
      <div class="header">
        <h2>System Health Monitoring</h2>
        <button (click)="refreshHealth()" class="btn-primary">Refresh</button>
      </div>

      <!-- Overall Status -->
      <div *ngIf="systemHealth" class="health-overview">
        <div class="overall-status" [class]="'status-' + systemHealth.overall_status">
          <h3>Overall System Status: {{ systemHealth.overall_status.toUpperCase() }}</h3>
        </div>
      </div>

      <!-- System Issues -->
      <div class="alerts-section">
        <h3>System Alerts & Recommendations</h3>
        <div *ngIf="getSystemAlerts().length === 0" class="no-alerts">
          All systems operating normally
        </div>
        <div *ngFor="let alert of getSystemAlerts()" class="alert" [class]="'alert-' + getSeverity(alert)">
          <strong>{{ alert.feed }}:</strong> {{ alert.message }}
          <div><small>Success Rate: {{ alert.success_rate }}%</small></div>
        </div>
      </div>

      <!-- Feed Metrics -->
      <div class="metrics-section" *ngIf="systemHealth?.metrics">
        <h3>Feed Metrics</h3>
        <div class="components-grid">
          <div *ngFor="let metric of getMetricsArray()" class="component-card">
            <div class="component-header">
              <h4>{{ metric.feed }}</h4>
              <span class="status-badge" [class]="'status-' + getMetricStatus(metric)">
                {{ getMetricStatus(metric).toUpperCase() }}
              </span>
            </div>
            <p class="component-message">
              Total Attempts: {{ metric?.data?.total_attempts }} <br />
              Successful Attempts: {{ metric?.data?.successful_attempts }} <br />
              Success Rate: {{ metric?.data?.success_rate }}%
            </p>
          </div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="metrics-section">
        <h3>Performance Metrics</h3>
        <div class="metrics-grid">
          <div class="metric-card">
            <h4>Compliance Check Performance</h4>
            <div class="metric-value">{{ getAverageCheckTime() }}ms</div>
            <small>Average check time</small>
          </div>
          <div class="metric-card">
            <h4>System Uptime</h4>
            <div class="metric-value">{{ getSystemUptime() }}</div>
            <small>Current uptime</small>
          </div>
          <div class="metric-card">
            <h4>Active Rules</h4>
            <div class="metric-value">{{ getActiveRulesCount() }}</div>
            <small>Currently active</small>
          </div>
          <div class="metric-card">
            <h4>Feed Status</h4>
            <div class="metric-value">{{ getActiveFeedsCount() }}/{{ getTotalFeedsCount() }}</div>
            <small>Active feeds</small>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="loading">Loading...</div>
      <div *ngIf="error" class="error">{{ error }}</div>
    </div>
  `,
  styles: [`
    .monitoring-section { padding: 20px 0; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .health-overview { margin-bottom: 30px; }
    .overall-status { text-align: center; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .status-healthy { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .status-warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
    .status-critical { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    .components-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    .component-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: white; }
    .component-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .component-header h4 { margin: 0; }
    .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .status-badge.status-healthy { background: #28a745; color: white; }
    .status-badge.status-warning { background: #ffc107; color: black; }
    .status-badge.status-critical { background: #dc3545; color: white; }
    .component-message { margin: 10px 0; color: #666; }
    .component-meta { color: #999; font-size: 12px; }
    .alerts-section { margin: 30px 0; }
    .no-alerts { text-align: center; color: #28a745; padding: 20px; background: #d4edda; border-radius: 4px; }
    .alert { padding: 10px; margin: 10px 0; border-radius: 4px; }
    .alert-warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
    .alert-critical { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    .metrics-section { margin: 30px 0; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .metric-card { text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: white; }
    .metric-card h4 { margin: 0 0 10px 0; color: #333; }
    .metric-value { font-size: 2em; font-weight: bold; color: #007bff; margin: 10px 0; }
    .metric-card small { color: #666; }
    .btn-primary { background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    .loading { text-align: center; padding: 20px; }
    .error { color: #dc3545; text-align: center; padding: 20px; }
  `]
})
export class MonitoringComponent implements OnInit {
  systemHealth: any;
  loading = false;
  error = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.refreshHealth();
    setInterval(() => this.refreshHealth(), 30000);
  }

  refreshHealth() {
    this.loading = true;
    this.apiService.getSystemHealth().subscribe({
      next: (health:any) => {
        this.systemHealth = health;
        this.loading = false;
        this.getMetricsArray()
      },
      error: (err) => {
        this.error = 'Failed to load system health';
        this.loading = false;
        console.error(err);
      }
    });
  }

  getSystemAlerts() {
    return this.systemHealth?.issues ?? [];
  }

  // getMetricsArray() {
  //   if (!this.systemHealth?.metrics) return [];
  //   return Object.entries(this.systemHealth.metrics).map(([feed, data]) => ({ feed, data }));
  // }

  getMetricsArray(): { feed: string; data: { total_attempts: number; successful_attempts: number; success_rate: number } }[] {
    if (!this.systemHealth?.metrics) return [];
    return Object.entries(this.systemHealth.metrics).map(([feed, data]) => ({
      feed,
      data: data as { total_attempts: number; successful_attempts: number; success_rate: number }
    }));
  }
  

  getSeverity(issue: any): string {
    if (issue.success_rate < 50) return 'critical';
    if (issue.success_rate < 80) return 'warning';
    return 'healthy';
  }

  getMetricStatus(metric: any): string {
    if (metric.data.success_rate < 50) return 'critical';
    if (metric.data.success_rate < 80) return 'warning';
    return 'healthy';
  }

  // Demo mock values
  getAverageCheckTime(): string {
    return (Math.random() * 100 + 50).toFixed(0);
  }

  getSystemUptime(): string {
    const hours = Math.floor(Math.random() * 720 + 1);
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }

  getActiveRulesCount(): number {
    return Math.floor(Math.random() * 20 + 5);
  }

  getActiveFeedsCount(): number {
    return Math.floor(Math.random() * 5 + 2);
  }

  getTotalFeedsCount(): number {
    return Math.floor(Math.random() * 3) + this.getActiveFeedsCount();
  }
}
