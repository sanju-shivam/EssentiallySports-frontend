// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class ApiService {

//   constructor() { }
// }


import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Article, ComplianceResult, PublishRequest } from '../models/article.model';
import { FeedConfig, FeedStats } from '../models/feed.model';
import { ComplianceRule, ValidatorType, SystemHealth } from '../models/compliance.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://127.0.0.1:8000/api';
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  constructor(private http: HttpClient) {}

  // Article methods
  getArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.baseUrl}/articles`, { headers: this.headers });
  }

  getArticle(id: number): Observable<Article> {
    return this.http.get<Article>(`${this.baseUrl}/articles/${id}`, { headers: this.headers });
  }

  createArticle(article: Article): Observable<Article> {
    return this.http.post<Article>(`${this.baseUrl}/articles`, article, { headers: this.headers });
  }

  updateArticle(id: number, article: Article): Observable<Article> {
    return this.http.put<Article>(`${this.baseUrl}/articles/${id}`, article, { headers: this.headers });
  }

  deleteArticle(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/articles/${id}`, { headers: this.headers });
  }

  publishToFeed(articleId: number, publishRequest: PublishRequest): Observable<ComplianceResult> {
    return this.http.post<ComplianceResult>(`${this.baseUrl}/articles/${articleId}/publish`, publishRequest, { headers: this.headers });
  }

  publishToMultipleFeeds(articleId: number, publishRequests: PublishRequest[]): Observable<ComplianceResult[]> {
    return this.http.post<ComplianceResult[]>(`${this.baseUrl}/articles/${articleId}/publish-multiple`, 
      { feeds: publishRequests }, { headers: this.headers });
  }

  checkCompliance(articleId: number, feedId: number): Observable<ComplianceResult> {
    return this.http.post<ComplianceResult>(`${this.baseUrl}/articles/${articleId}/check-compliance`, 
      { feed_id: feedId }, { headers: this.headers });
  }

  // Feed methods
  getFeeds(): Observable<FeedConfig[]> {
    return this.http.get<FeedConfig[]>(`${this.baseUrl}/feeds`, { headers: this.headers });
  }

  getFeed(id: number): Observable<FeedConfig> {
    return this.http.get<FeedConfig>(`${this.baseUrl}/feeds/${id}`, { headers: this.headers });
  }

  createFeed(feed: FeedConfig): Observable<FeedConfig> {
    return this.http.post<FeedConfig>(`${this.baseUrl}/feeds`, feed, { headers: this.headers });
  }

  updateFeed(id: number, feed: FeedConfig): Observable<FeedConfig> {
    return this.http.put<FeedConfig>(`${this.baseUrl}/feeds/${id}`, feed, { headers: this.headers });
  }

  deleteFeed(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/feeds/${id}`, { headers: this.headers });
  }

  getFeedStats(feedId: number): Observable<FeedStats> {
    return this.http.get<FeedStats>(`${this.baseUrl}/feeds/${feedId}/stats`, { headers: this.headers });
  }

  // Compliance methods
  getComplianceRules(): Observable<ComplianceRule[]> {
    return this.http.get<ComplianceRule[]>(`${this.baseUrl}/compliance/rules`, { headers: this.headers });
  }

  createComplianceRule(rule: ComplianceRule): Observable<ComplianceRule> {
    return this.http.post<ComplianceRule>(`${this.baseUrl}/compliance/rules`, rule, { headers: this.headers });
  }

  updateComplianceRule(id: number, rule: ComplianceRule): Observable<ComplianceRule> {
    return this.http.put<ComplianceRule>(`${this.baseUrl}/compliance/rules/${id}`, rule, { headers: this.headers });
  }

  getAvailableValidators(): Observable<ValidatorType[]> {
    return this.http.get<ValidatorType[]>(`${this.baseUrl}/compliance/validators`, { headers: this.headers });
  }

  // Health monitoring
  getSystemHealth(): Observable<SystemHealth> {
    return this.http.get<SystemHealth>(`${this.baseUrl}/health`, { headers: this.headers });
  }
}