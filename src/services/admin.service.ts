import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, map } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { NzTableSortOrder } from 'ng-zorro-antd/table';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private tokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  public token$: Observable<string | null> = this.tokenSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private isCheckingAuthSubject = new BehaviorSubject<boolean>(false); // New state
  isCheckingAuth$ = this.isCheckingAuthSubject.asObservable(); // Observable for checking state

  constructor(private http: HttpClient) {
    this.loadTokens();
  }

  /** Login method with token storage and error handling */
  login(username: string, password: string): Observable<any> {
    return this.http.post<{ token: string }>('/api/admin/login', { username, password }).pipe(
      tap(response => {
        const token = response.token;
        localStorage.setItem('token', token);
        this.tokenSubject.next(token);
      }),
      catchError(error => {
        console.error('Login failed', error);
        return of(null);
      })
    );
  }

  /** Logout method to clear tokens and notify observers */
  logout(): void {
    localStorage.removeItem('token');
    this.tokenSubject.next(null);
  }

  /** Reactive method to check if the user is logged in */
  isLoggedIn(): Observable<boolean> {
    return this.token$.pipe(
      map(token => !!token)
    );
  }

  /** Load tokens from localStorage into BehaviorSubjects */
  private loadTokens(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = window.localStorage.getItem('token');
      this.tokenSubject.next(token);
    } else {
      this.tokenSubject.next(null);
    }
  }

  /** Set loading state */
  setLoading(isLoading: boolean): void {
    this.loadingSubject.next(isLoading);
  }

  /** Set checking authentication state */
  setCheckingAuth(isChecking: boolean): void {
    this.isCheckingAuthSubject.next(isChecking);
  }

  /** Helper method to create headers with the normal token */
  private createHeaders(): HttpHeaders {
    const token = this.tokenSubject.value;
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /** Get event summary */
  getSummary(): Observable<any> {
    const headers = this.createHeaders();
    
    return this.http.get<any>(`/api/admin/summary`, { headers }).pipe(
      map(response => response),
      catchError(error => {
        console.error('Error fetching summary', error);
        return of(null);
      })
    );
  }

  /** Get conferences method with normal token */
  getConferences(orderField?: string, orderDirection?: NzTableSortOrder | undefined, csv: boolean = false): Observable<any[]> {
    const headers = this.createHeaders();
    let params = new HttpParams();
      
    if (orderField) {
      // Determine the order parameter based on direction
      const order = orderDirection === 'ascend' 
          ? orderField 
          : orderDirection === 'descend' 
              ? `-${orderField}`
              : undefined;
      
      if (order) {
          params = params.set('order', order);
      }
    }

    if (csv) {
      params = params.set('csv', 'true');
    }
      
    return this.http.get<{ data: any[] }>('/api/admin/sessions', {
      headers,
      params
    }).pipe(
        map(response => response.data),
        catchError(error => {
            console.error('Error fetching sessions', error);
            return of([]);
        })
    );
  }

  /** Get attendees method with normal token */
  getAttendees(orderField?: string, orderDirection?: NzTableSortOrder | undefined, csv: boolean = false): Observable<any[]> {
    const headers = this.createHeaders();
    let params = new HttpParams();

    // Set the 'order' parameter based on the orderField and orderDirection
    if (orderField) {
        // Determine the order parameter based on direction
        const order = orderDirection === 'ascend' 
            ? orderField 
            : orderDirection === 'descend' 
                ? `-${orderField}`
                : undefined;
        
        if (order) {
            params = params.set('order', order);
        }
    }
    
    // Set the 'csv' parameter if requested
    if (csv) {
        params = params.set('csv', 'true');
    }
    
    return this.http.get<{ data: any[] }>('/api/admin/users', {
        headers,
        params
    }).pipe(
        map(response => response.data),
        catchError(error => {
            console.error('Error fetching attendees', error);
            return of([]);
        })
    );
  }

  syncData(): Observable<any> {
    const headers = this.createHeaders();
    return this.http.post<any>('/api/admin/import-xml', {}, { headers }).pipe(
      map(response => response),
      catchError(error => {
        console.error('Error syncing data', error);
        return of(null);
      })
    );
  }

  // Method to fetch last sync time
  getLastSyncTime(): Observable<{ last_sync_time: string }> {
    const headers = this.createHeaders();
    return this.http.get<{ last_sync_time: string }>('/api/admin/last-sync-time', { headers });
  }

  private downloadCsv(url: string, fallbackFilename: string): void {
    const headers = this.createHeaders();
    
    this.http.get(url, { 
      headers, 
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: (response: HttpResponse<Blob>) => {
        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = fallbackFilename;
        
        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        // Create a URL for the blob
        const url = window.URL.createObjectURL(response.body as Blob);
        
        // Create a temporary anchor element
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        // Append to body, click programmatically and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading CSV:', error);
      }
    });
  }

  /** Export attendees data as CSV */
  exportAttendeesCsv(): void {
    this.downloadCsv('/api/admin/users?csv=true', 'attendees.csv');
  }

  /** Export talks data as CSV */
  exportTalksCsv(): void {
    this.downloadCsv('/api/admin/sessions?csv=true', 'sessions.csv');
  }
}
