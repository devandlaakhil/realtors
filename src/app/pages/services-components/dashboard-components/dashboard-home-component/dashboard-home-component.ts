import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { RealEstateApiService } from '../../../../api-services/realestate-api-services';
import { ToastrService } from 'ngx-toastr';
import { Router, RouterModule } from '@angular/router';

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
  reraStatus?: 'Verified' | 'Pending';
  conversationId? : string,
  propertyId? : string
}

@Component({
  selector: 'app-dashboard-home-component',
  imports: [CommonModule,RouterModule],
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
  myMessage: any = [];

  ngOnInit(): void {
    this.getMyListings();
    this.getMyMessages();
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
      name: '',
      type: '',
      location: '',
      time: '',
      phone: '',
      conversationId : ''
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

  getMyMessages() {
    this.realEstateApiSrc
      .getMyMessage()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.getMyMessages = res.data;
          this.recentLeads = res.data.map((item: any) => ({
            name: item.userDetails?.name || '',
            type: item.property?.propertyType || '',
            location: `${item.property?.location?.area || ''}, ${item.property?.location?.city || ''}`,
            time: this.getTimeAgo(item.lastMessageAt),
            phone: item.userDetails?.mobile || '',
            conversationId : item.id,
            propertyId : item.propertyId
          }));
          this.cdr.detectChanges();
        },
        error: () => {
          this.tostrService.error('Something went wrong', 'Fail');
        },
      });
  }

  getTimeAgo(dateString: string): string {
    const now = new Date().getTime();
    const messageTime = new Date(dateString).getTime();
    const diffMs = now - messageTime;
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (minutes < 1) {
      return 'Just now';
    }
    if (minutes < 60) {
      return `${minutes} min ago`;
    }
    if (hours < 24) {
      return `${hours} hr ago`;
    }
    if (days < 30) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    const months = Math.floor(days / 30);
    if (months < 12) {
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}
