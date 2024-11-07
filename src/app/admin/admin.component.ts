import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { AdminService } from '../../services/admin.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DateFormatPipe } from '../../shared/date-format.pipe';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzButtonModule,
    NzAlertModule,
    NzInputModule,
    RouterOutlet,
    RouterModule,
    DateFormatPipe
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  @Input() searchTerm: string = '';
  adminService = inject(AdminService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  syncAlert: boolean = false;
  syncAlertMessage: string = '';
  syncAlertDescription: string = '';
  syncAlertType: "success" | "info" | "warning" | "error" = 'info';

  summary: { all_users: number, total_sessions: number; total_bookmarks: number; total_rates: number } | null = null;
  lastSyncTime: string | null = null;
  
  constructor() {
    this.checkLoginStatus();
  }

  ngOnInit(): void {
    // Subscribe to query params to initialize searchTerm
    this.route.queryParams.subscribe(params => {
      this.searchTerm = params['search'] || ''; // Set searchTerm from query params
    });

    this.getSummary();
    this.fetchLastSyncTime();
  }

  checkLoginStatus(): void {
    const isLoggedIn = this.adminService.isLoggedIn();
    if (!isLoggedIn) {
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    this.adminService.logout();
    this.router.navigate(['/login']);
  }

  filterTable(): void {
    this.router.navigate([], {
      queryParams: { search: this.searchTerm },
      queryParamsHandling: 'merge',
    });
  }

 /** Fetch summary data */
  getSummary(): void {
    this.adminService.getSummary().subscribe(
      data => {
        this.summary = data;
      },
      error => {
        console.error('Error fetching summary:', error);
      }
    );
  }

  /** Fetch last sync time */
  fetchLastSyncTime(): void {
    this.adminService.getLastSyncTime().subscribe(
      data => {
        this.lastSyncTime = data.last_sync_time; // Store the last sync time
      },
      error => {
        console.error('Error fetching last sync time:', error);
      }
    );
  }

  syncData(): void {
    this.adminService.syncData().subscribe(
        response => {
            if (response) {
              
              // Check if there were changes
              if (response.changes && Object.keys(response.changes).length === 0) {
                  this.syncAlertType = 'info';
                  this.syncAlertMessage = 'No changes detected during sync.';
                  this.syncAlertDescription = 'The data was already up-to-date.';
              } else {
                  this.syncAlertType = 'success';
                  this.syncAlertMessage = 'Data synced successfully!';
                  this.syncAlertDescription = 'Your data has been updated.';
              }
              
              this.syncAlert = true; // Show the alert

              this.fetchLastSyncTime();

              setTimeout(() => {
                this.syncAlert = false;
              }, 5000);
            } else {
              this.syncAlertType = 'info';
              this.syncAlertMessage = 'Sync operation completed.';
              this.syncAlertDescription = 'No data returned from sync.';
              this.syncAlert = true; // Show the alert

              this.fetchLastSyncTime();

              setTimeout(() => {
                this.syncAlert = false;
              }, 5000);
            }
        },
        error => {
            console.error('Error during sync:', error);
            this.syncAlertType = 'error';
            this.syncAlertMessage = 'Error syncing data';
            this.syncAlertDescription = 'An error occurred while syncing your data.';
            this.syncAlert = true; // Show the alert

            setTimeout(() => {
              this.syncAlert = false;
          }, 5000);
        }
    );
  }
}
