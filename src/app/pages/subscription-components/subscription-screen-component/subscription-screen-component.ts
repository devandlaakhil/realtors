import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { SubscriptionApiService } from '../../../api-services/subscription-api-service';
import { Subject, takeUntil } from 'rxjs';
import { UserApiServices } from '../../../api-services/user-api-services';
import { ToastrService } from 'ngx-toastr';

declare var Razorpay: any;

@Component({
  selector: 'app-subscription-screen-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-screen-component.html',
  styleUrl: './subscription-screen-component.css',
})
export class SubscriptionScreenComponent implements OnInit,OnDestroy {
  currentPlan = 'FREE';
  selectedPlan = '';
  selectedPlanName = 'No Plan Selected';
  private destroy$ = new Subject<void>();
  private subscriptionApiSrv = inject(SubscriptionApiService);
  userApiSrv = inject(UserApiServices);
  toastr = inject(ToastrService);
  user = {
    name: '',
    email: '',
    mobile: '',
  };

  ngOnInit(): void {
     this.userApiSrv
          .getUser()
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              this.user = res;
            },
            error: () => {
              this.toastr.error('Something went wrong', 'Fail');
            },
          });
  }

  selectPlan(plan: string): void {
    this.selectedPlan = plan;

    switch (plan) {
      case 'PROPERTY_PRO':
        this.selectedPlanName = 'Property Pro';
        break;

      case 'SERVICE_PRO':
        this.selectedPlanName = 'Service Pro';
        break;

      case 'BUSINESS_PRO':
        this.selectedPlanName = 'Business Pro';
        break;

      default:
        this.selectedPlanName = 'No Plan Selected';
    }
  }

  buyPlan(): void {
    if (!this.selectedPlan) {
      // alert('Please select a plan');
      this.toastr.warning('Please select a plan','Warning');
      return;
    }

    this.subscriptionApiSrv
      .createOrder(this.selectedPlan)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const options = {
            key: 'rzp_live_T4Ir9tXg8h5845',
            amount: res.order.amount,
            currency: res.order.currency,
            order_id: res.order.id,
            name: 'Realtor App',
            description: this.selectedPlan,
            prefill: {
              name: this.user.name,
              email: this.user.email,
              contact: this.user.mobile,
            },
            theme: {
              color: '#2563eb',
            },
            handler: (paymentResponse: any) => {
              const payload = {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                plan: this.selectedPlan,
              };
              this.subscriptionApiSrv
                .verifyPayment(payload)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: (res: any) => {
                    //console.log(res);
                    //alert('Subscription Activated Successfully');
                    this.toastr.success('Subscription Activated Successfully')
                  },
                  error: (err) => {
                    console.error(err);
                    //alert('Payment Verification Failed');
                    this.toastr.error('Payment Verification Failed')
                  },
                });
            },
          };
          const rzp = new Razorpay(options);
          rzp.on('payment.failed', (response: any) => {
            // console.error('PAYMENT FAILED');
            // console.error(response);
            //alert('Payment Failed. Please try again.');
            this.toastr.error('Payment Failed. Please try again.');
          });
          rzp.open();
        },
        error: (err) => {
          //console.error('Create Order Error');
          console.error(err);
          //alert('Unable to create payment order.');
          this.toastr.error('Unable to create payment order.')
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
