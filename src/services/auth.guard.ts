import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { map, tap, catchError } from 'rxjs/operators';
import { AdminService } from './admin.service';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private adminService: AdminService, private router: Router) {}

  canActivate(): Observable<boolean> {
    this.adminService.setCheckingAuth(true);
    this.adminService.setLoading(true);

    return this.adminService.isLoggedIn().pipe(
      tap(isLoggedIn => {
        if (!isLoggedIn) {
          this.router.navigate(['/login']);
        }
      }),
      map(isLoggedIn => {
        this.adminService.setLoading(false);
        this.adminService.setCheckingAuth(false);
        return isLoggedIn;
      }),
      catchError((err: any) => {
        console.error('Error checking authentication', err);
        this.adminService.setLoading(false);
        this.adminService.setCheckingAuth(false);
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
