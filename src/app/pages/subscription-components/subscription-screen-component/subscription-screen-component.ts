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
export class SubscriptionScreenComponent implements OnInit, OnDestroy {
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
      this.toastr.warning('Please select a plan', 'Warning');
      return;
    }

    this.subscriptionApiSrv
      .createOrder(this.selectedPlan)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const order = res?.order || {};
          const localOrderId = res?.data?.id || order.id;
          const options: any = {
            key: 'rzp_live_T4Ir9tXg8h5845',

            amount: order.amount,

            currency: order.currency || 'INR',

            notes: {
              local_order_id: localOrderId,
              plan: this.selectedPlan,
            },

            name: 'Realtor App',

            description: this.selectedPlan,

            method: {
              upi: true,
              card: true,
              netbanking: true,
              wallet: true,
              paylater: true,
            },

            config: {
              display: {
                blocks: {
                  upi: {
                    name: 'Pay using UPI',
                    instruments: [
                      {
                        method: 'upi',
                        flows: ['intent', 'collect', 'qr'],
                      },
                    ],
                  },
                },
                sequence: ['block.upi'],
                preferences: {
                  show_default_blocks: true,
                },
              },
            },

            prefill: {
              name: this.user?.name || '',
              email: this.user?.email || '',
              contact: this.user?.mobile || '',
            },

            theme: {
              color: '#2563eb',
            },

            modal: {
              ondismiss: () => {
                this.toastr.info('Payment cancelled');
              },
            },

            handler: (paymentResponse: any) => {
              const payload = {
                order_id: localOrderId,

                razorpay_order_id: paymentResponse.razorpay_order_id || localOrderId,

                razorpay_payment_id: paymentResponse.razorpay_payment_id,

                razorpay_signature: paymentResponse.razorpay_signature,
              };

              this.subscriptionApiSrv
                .verifyPayment(payload)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: () => {
                    this.toastr.success('Subscription Activated Successfully');

                    // refresh subscription info if needed
                  },

                  error: (err) => {
                    console.error(err);

                    this.toastr.error('Payment Verification Failed');
                  },
                });
            },
          };

          if (typeof order.id === 'string' && order.id.startsWith('order_')) {
            options.order_id = order.id;
          }

          const rzp = new Razorpay(options);

          rzp.on('payment.failed', (response: any) => {
            console.error('Payment Failed', response);

            this.toastr.error(response.error?.description || 'Payment Failed');
          });

          rzp.open();
        },

        error: (err) => {
          console.error(err);

          this.toastr.error('Unable to create payment order');
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
