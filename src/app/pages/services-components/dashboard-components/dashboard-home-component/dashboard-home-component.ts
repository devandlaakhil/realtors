import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

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
export class DashboardHomeComponent {

    // Dashboard Analytics
  metrics: Metric[] = [
    {
      title: 'Live Listings',
      value: '12 Properties',
      subtext: '8 Apartments, 4 Plots',
      icon: '🏢',
      colorClass: 'blue-accent',
    },
    {
      title: 'Total Leads Recieved',
      value: '248 Buyers',
      subtext: '+18 new entries today',
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
}
