import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UserApiServices } from '../../../api-services/user-api-services';
import { AuthService } from '../../../auth-services/auth-services';
import { DashboardServices } from '../../../shared-services/dashboard-services';
import { TranslatePipe } from '../../../pipes/translatepipe-pipe';

@Component({
  selector: 'app-user-login-component',
  imports: [   CommonModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    TranslatePipe],
  templateUrl: './user-login-component.html',
  styleUrl: './user-login-component.css',
})
export class UserLoginComponent implements OnInit {

  loginForm: any = FormGroup;
  formBuiler: any = inject(FormBuilder);
  private _loginApi = inject(UserApiServices);
  tostrService = inject(ToastrService);
  router = inject(Router);
  authService = inject(AuthService);
  dashboardService = inject(DashboardServices);
  hidePassword = true;

   ngOnInit(): void {
    this.loginForm = this.formBuiler.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

   loginUser() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.showToast('Please enter your email and password to continue.', 'Sign in needs attention', 'warning');
      return;
    }

    const formData = this.loginForm.value;

    this._loginApi.login(formData).subscribe({
      next: (res) => {
        if (res.data && res.data.token) {
          this.authService.setUser({
            id: res.data.user.id,
            name: res.data.user.name,
            email: res.data.user.email,
          });
          this.authService.logIn(res.data.token);
          this.authService.setRefreshToken(res.data.refreshToken);
          this.showToast('Welcome back. Taking you to your home.', 'Signed in', 'success');
          this.dashboardService.logIn();
          this.router.navigate(['/']);
        } else {
          this.showToast('Login succeeded but no access token was returned. Please try again.', 'Token missing', 'error');
        }
      },
      error: (err) => {
        this.showToast(this.loginErrorMessage(err), 'Sign in failed', 'error');
        this.loginForm.reset();
      },
    });
  }
  register() {
    this.router.navigate(['/register']);
  }

  private showToast(message: string, title: string, type: 'success' | 'error' | 'warning') {
    this.tostrService.clear();
    this.tostrService[type](message, title);
  }

  private loginErrorMessage(err: any): string {
    const message = err?.error?.msg || err?.error?.message || err?.message || '';
    if (message.toLowerCase().includes('email not confirmed')) {
      return 'Please verify your email in Supabase or turn off Confirm email in Supabase Auth settings.';
    }
    if (err?.error?.error_code === 'invalid_credentials' || message.toLowerCase().includes('invalid login credentials')) {
      return 'Invalid login credentials. Confirm this user exists in Supabase Auth, the email is verified, and the password is correct.';
    }
    return message || 'We could not sign you in. Please check your details.';
  }
}
