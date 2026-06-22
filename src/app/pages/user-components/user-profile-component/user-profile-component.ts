import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserApiServices } from '../../../api-services/user-api-services';
import { Subject, take, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { CommonServices } from '../../../shared-services/common-services';
import { TranslatePipe } from '../../../pipes/translatepipe-pipe';

@Component({
  selector: 'app-user-profile-component',
  imports: [CommonModule, FormsModule,TranslatePipe,DatePipe],
  templateUrl: './user-profile-component.html',
  styleUrl: './user-profile-component.css',
})
export class UserProfileComponent implements OnInit {
  isEditingProfile = false;
  isChangingPassword = false;
  userApiSrv = inject(UserApiServices);
  destroy$ = new Subject<any>();
  toastr = inject(ToastrService);
  cdr = inject(ChangeDetectorRef);
  address: string | null = '';
  commonSrv = inject(CommonServices);

  user = {
    name: '',
    email: '',
    mobile: '',
    subscription : {plan:'',startDate:'',endDate:''},
    about: ''
  };

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  ngOnInit(): void {
    this.userApiSrv
      .getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.user = res;
          this.commonSrv.address$.pipe(take(1)).subscribe((data) => {
            this.address = data;
          });
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastr.error('Something went wrong', 'Fail');
        },
      });
  }

  editUser = { ...this.user };

  startEdit() {
    this.editUser = { ...this.user };
    this.isEditingProfile = true;
  }

  cancelEdit() {
    this.isEditingProfile = false;
  }

  saveProfile() {
    this.user = { ...this.editUser };
    this.userApiSrv.updateUserDetails(this.user)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next : (res) => {
        this.toastr.success('Details updated successfully','Success');
      },
      error : () => {
        this.toastr.error('Something went wrong', 'Fail');
      }
    })
    this.isEditingProfile = false;
  }

  openPasswordSection() {
    this.isChangingPassword = true;
  }

  cancelPasswordChange() {
    this.isChangingPassword = false;

    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
  }

  updatePassword() {
    // validation
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    this.userApiSrv.updateUserPassword(this.passwordData)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next : (res) => {
        this.toastr.success("Password updated successfully",'Success');
      },
      error : () => {
        this.toastr.error("Something went wrong", 'Fail')
      }
    })

    this.isChangingPassword = false;
  }
}
