import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzIconModule,
    NzButtonModule,
    NzAlertModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  fb = inject(FormBuilder);
  router = inject(Router);
  adminService = inject(AdminService);
  
  loginForm: FormGroup;
  passwordFieldType: string = 'password';
  isPasswordVisible: boolean = false;
  formSubmitted: boolean = false;
  loginError: string | null = null;
  alertDescription: string | null = null;

  constructor() {
    this.adminService.setLoading(false);
    
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required],
    });
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
    this.passwordFieldType = this.isPasswordVisible ? 'text' : 'password';
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    this.formSubmitted = true;
    if (this.loginForm.valid) {
      this.login();
    } else {
      this.loginForm.markAllAsTouched();
      this.loginError = 'Login failed';
      this.alertDescription = 'Please fill out all required fields';
      setTimeout(() => {
        this.loginError = null;
      }, 5000);
    }
  }

  login(): void {
    const { username, password } = this.loginForm.value;
  
    this.adminService.login(username, password).subscribe({
      next: (response) => {
        if (response) {
          // Navigate to the desired route after a successful login
          this.router.navigate(['/talks'], { state: { loginSuccess: 'You have logged in!' } });
        } else {
          this.handleLoginError();
        }
      },
      error: (err) => {
        console.error('Error during login', err);
        this.handleLoginError();
      }
    });
  }
  
  // Helper method to handle login errors
  private handleLoginError(): void {
    this.loginError = 'Invalid credentials';
    this.alertDescription = 'Please try again';
    setTimeout(() => {
      this.loginError = null;
    }, 5000);
  }
}
