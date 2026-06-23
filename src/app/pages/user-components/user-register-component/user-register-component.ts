import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { UserApiServices } from '../../../api-services/user-api-services';
import { ToastrService } from 'ngx-toastr';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translatepipe-pipe';

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
  hidePassword = true;

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
    const formData = this.registerForm.value;
    if(this.registerForm.invalid){
      this.registerForm.markAllAsTouched();
       this.submitted = true;
       this.showToast('Please complete the highlighted fields before creating your account.', 'Registration needs attention', 'warning');
       return;
    }
    // to call any api method subscribe is mandatory
    this.registerService.register(formData).subscribe({
      next : (res) => {
        this.showToast('Your account is ready. Please sign in to continue.', 'Account created', 'success');
        this.router.navigate(['/login'])
        this.registerForm.reset();
      },
      error : (err) =>{
        this.showToast(err?.error?.message || 'We could not create your account right now. Please try again.', 'Registration failed', 'error');
        this.registerForm.reset();
      }
    })
  }

  private showToast(message: string, title: string, type: 'success' | 'error' | 'warning') {
    this.tostrService.clear();
    this.tostrService[type](message, title);
  }
}
