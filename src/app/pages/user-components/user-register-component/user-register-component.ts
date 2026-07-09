import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { UserApiServices } from '../../../api-services/user-api-services';
import { ToastrService } from 'ngx-toastr';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translatepipe-pipe';
import { AuthService } from '../../../auth-services/auth-services';
import { DashboardServices } from '../../../shared-services/dashboard-services';

@Component({
  selector: 'app-user-register-component',
  imports: [CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    TranslatePipe 
  ],
  templateUrl: './user-register-component.html',
  styleUrl: './user-register-component.css',
})
export class UserRegisterComponent implements OnInit {

  nameRegx: string = "([a-zA-Z0-9 ]*)";
  //formgrop holds all the input fields. 
  registerForm: any = FormGroup;
  //if use inject method then no need to use any construtor.
  formBuilder = inject(FormBuilder);
  submitted: boolean = false;
  registerService = inject(UserApiServices);
  tostrService = inject(ToastrService)
  router = inject(Router);
  authService = inject(AuthService);
  dashboardService = inject(DashboardServices);
  hidePassword = true;
  isRegistering = false;

  ngOnInit(): void {
    //by using formBuilder group the input fields.
    this.registerForm = this.formBuilder.group({
      //if you have multiple validators its better to use array of validators.
      //Here for globalProperties no need to create any instance as it is having all static variables.
      name: ['', [Validators.required, Validators.pattern(this.nameRegx)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(5)]],
      mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]]
    })
  }

   onRegister(){
    if (this.isRegistering) {
      return;
    }

    const formData = this.registerForm.value;
    if(this.registerForm.invalid){
      this.registerForm.markAllAsTouched();
       this.submitted = true;
       this.showToast('Please complete the highlighted fields before creating your account.', 'Registration needs attention', 'warning');
       return;
    }
    this.isRegistering = true;
    // to call any api method subscribe is mandatory
    this.registerService.register(formData).pipe(
      finalize(() => this.isRegistering = false)
    ).subscribe({
      next : (res) => {
        if (res?.data?.token) {
          this.authService.setUser({
            id: res.data.user.id,
            name: res.data.user.name,
            email: res.data.user.email,
          });
          this.authService.logIn(res.data.token);
          this.authService.setRefreshToken(res.data.refreshToken);
          this.dashboardService.logIn();
          this.showToast('Your account is ready. Taking you to your home.', 'Account created', 'success');
          this.router.navigate(['/']);
        } else {
          this.showToast('Your account is ready. Please verify your email and sign in.', 'Account created', 'success');
          this.router.navigate(['/login']);
        }
        this.registerForm.reset();
      },
      error : (err) =>{
        this.showToast(this.registrationErrorMessage(err), 'Registration failed', 'error');
      }
    })
  }

  private showToast(message: string, title: string, type: 'success' | 'error' | 'warning') {
    this.tostrService.clear();
    this.tostrService[type](message, title);
  }

  private registrationErrorMessage(err: any): string {
    const message = err?.error?.msg || err?.error?.message || err?.message || '';
    if (err?.error?.error_code === 'email_address_invalid') {
      return 'Supabase rejected this email address. Please use a real, unique email address or check Supabase Auth email restrictions.';
    }
    if (err?.error?.error_code === 'over_email_send_rate_limit' || message.toLowerCase().includes('email rate limit')) {
      return 'Too many verification emails were requested. Please wait a few minutes before trying again, or turn off Confirm email in Supabase Auth settings during testing.';
    }
    if (message.toLowerCase().includes('already registered') || message.toLowerCase().includes('already exists')) {
      return 'This email is already registered. Please login instead.';
    }
    return message || 'We could not create your account right now. Please try again.';
  }
}
