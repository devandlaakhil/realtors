import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { RealEstateApiService } from '../../../../api-services/realestate-api-services';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

interface Metric {
  title: string;
  value: string;
  subtext: string;
  icon: string;
  colorClass: string;
}

interface Lead {
  name: string;
  type: string;
  location: string;
  time: string;
  phone: string;
  reraStatus: 'Verified' | 'Pending';
}

@Component({
  selector: 'app-dashboard-home-component',
  imports: [CommonModule],
  templateUrl: './dashboard-home-component.html',
  styleUrl: './dashboard-home-component.css',
})
export class DashboardHomeComponent implements OnInit {
  listings: any = {};
  realEstateApiSrc = inject(RealEstateApiService);
  destroy$ = new Subject<any>();
  tostrService = inject(ToastrService);
  cdr = inject(ChangeDetectorRef);
  router = inject(Router);
  subText: string = '';

  ngOnInit(): void {
    this.getMyListings();
  }
  // Dashboard Analytics
  metrics: Metric[] = [
    {
      title: 'Live Listings',
      value: '0 Properties',
      subtext: '',
      icon: '🏢',
      colorClass: 'blue-accent',
    },
    {
      title: 'Properties Status',
      value: 'Status',
      subtext: '',
      icon: '📈',
      colorClass: 'emerald-accent',
    },
    {
      title: 'Ad Wallet Balance',
      value: '₹4,250',
      subtext: 'UPI Wallet Active',
      icon: '👛',
      colorClass: 'amber-accent',
    },
  ];

  // Indian Market Inbound Enquiries
  recentLeads: Lead[] = [
    {
      name: 'Arun Sharma',
      type: 'Looking for 3 BHK Apartment',
      location: 'Whitefield, Bengaluru',
      time: '5 mins ago',
      phone: '+919876543210',
      reraStatus: 'Verified',
    },
    {
      name: 'Priya Patel',
      type: 'Interested in NA Layout Plot',
      location: 'Gachibowli, Hyderabad',
      time: '42 mins ago',
      phone: '+918765432109',
      reraStatus: 'Verified',
    },
    {
      name: 'Vikram Singh',
      type: 'Inquiring 2 BHK Builder Floor',
      location: 'Sector 62, Noida',
      time: '2 hours ago',
      phone: '+917654321098',
      reraStatus: 'Pending',
    },
  ];

  getMyListings() {
    this.realEstateApiSrc
      .getListins()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.listings = res;

          const subText = res.data.propertyTypes
            .map((item: any) => `${item.count} ${item._id}${item.count > 1 ? 's' : ''}`)
            .join(', ');
          
           const statusText = Object.entries(res.data.status)
              .map(([key, value]) => `${value} ${key}`)
              .join(', ');

          this.metrics[0] = {
            ...this.metrics[0],
            value: `${res.data.totalProperties} Properties`,
            subtext: subText,
          };

          this.metrics[1] = {
            ...this.metrics[1],
            subtext: statusText,
          };

          this.cdr.detectChanges();
        },

        error: () => {
          this.tostrService.error('Something went wrong', 'Fail');
        },
      });
  }
}
