// import { Component } from '@angular/core';
// import { RouterOutlet } from '@angular/router';

// @Component({
//   selector: 'app-root',
//   imports: [RouterOutlet],
//   templateUrl: './app.component.html',
//   styleUrl: './app.component.css'
// })
// export class AppComponent {
//   title = 'frontend';
// }


import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MonitoringComponent } from './components/monitoring.component';
import { ArticlesComponent } from './components/articles.component';
import { FeedsComponent } from './components/feeds.component';
import { DatePipe } from './pipe/datePipe';
import { ComplianceComponent } from './components/ompliance.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-root',
  imports: [MonitoringComponent,ArticlesComponent,FeedsComponent,ComplianceComponent,CommonModule,FormsModule],
  template: `
    <div class="container">
      <h1>Content Feed Compliance Controller</h1>
      <nav>
        <button [class.active]="activeTab === 'articles'" (click)="activeTab = 'articles'">Articles</button>
        <button [class.active]="activeTab === 'feeds'" (click)="activeTab = 'feeds'">Feeds</button>
        <button [class.active]="activeTab === 'compliance'" (click)="activeTab = 'compliance'">Compliance Rules</button>
        <button [class.active]="activeTab === 'monitoring'" (click)="activeTab = 'monitoring'">System Health</button>
      </nav>
      
      <app-articles *ngIf="activeTab === 'articles'"></app-articles>
      <app-feeds *ngIf="activeTab === 'feeds'"></app-feeds>
      <app-compliance *ngIf="activeTab === 'compliance'"></app-compliance>
      <app-monitoring *ngIf="activeTab === 'monitoring'"></app-monitoring>
    </div>
  `,
  styles: [`
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    nav { margin: 20px 0; }
    nav button { margin: 0 10px; padding: 10px 20px; border: 1px solid #ccc; background: #f5f5f5; cursor: pointer; }
    nav button.active { background: #007bff; color: white; }
    h1 { color: #333; }
  `]
})
export class AppComponent {
  activeTab = 'articles';
}