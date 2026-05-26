import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UserApiServices } from '../../../api-services/user-api-services';
import { AuthService } from '../../../auth-services/auth-services';
import { DashboardServices } from '../../../shared-services/dashboard-services';

@Component({
  selector: 'app-user-login-component',
  imports: [   CommonModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,],
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

   ngOnInit(): void {
    this.loginForm = this.formBuiler.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

   loginUser() {
    if (this.loginForm.invalid) return;

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
          this.tostrService.success('Login Successful', 'Success');
          this.dashboardService.logIn();
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.tostrService.error(err?.error?.message || 'Login failed', 'Fail');
        this.loginForm.reset();
      },
    });
  }
  register() {
    this.router.navigate(['/register']);
  }
}
