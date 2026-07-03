import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import '../../../../shared-services/firebase';
import { listProviderCalls, ListProviderCallsData } from '@dataconnect/generated';
import { Chart, registerables } from 'chart.js';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../auth-services/auth-services';
import { UserApiServices } from '../../../../api-services/user-api-services';

type ProviderCall = ListProviderCallsData['serviceCalls'][number];

Chart.register(...registerables);

@Component({
  selector: 'app-reports-component',
  imports: [CommonModule],
  templateUrl: './reports-component.html',
  styleUrl: './reports-component.css',
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dailyChart') dailyChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('serviceChart') serviceChartCanvas?: ElementRef<HTMLCanvasElement>;

  private readonly authService = inject(AuthService);
  private readonly userApi = inject(UserApiServices);
  private readonly cdr = inject(ChangeDetectorRef);
  private charts: Chart[] = [];
  private viewReady = false;

  readonly user = this.authService.getUser();
  calls: ProviderCall[] = [];
  loggedInPhoneNumber = '';
  loading = true;
  loadingMore = false;
  hasMore = false;
  errorMessage = '';
  private readonly pageSize = 10;

  get callsReceived(): number {
    return this.calls.length;
  }

  get uniqueCallers(): number {
    return new Set(this.calls.map((call) => call.userId || call.userPhoneNumber)).size;
  }

  ngOnInit(): void {
    this.loadCalls();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  async loadCalls(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.calls = [];
    try {
      const response = await firstValueFrom(this.userApi.getUser(true));
      const profile = response?.data ?? response;
      this.loggedInPhoneNumber = String(
        profile?.mobile ?? profile?.phoneNumber ?? profile?.phone ?? '',
      ).trim();
      if (!this.loggedInPhoneNumber) {
        throw new Error('Add a mobile number to your profile to view call reports.');
      }

      const result = await this.fetchCallPage(0);
      this.calls = result.data.serviceCalls ?? [];
      this.hasMore = this.calls.length === this.pageSize;
      this.renderCharts();
    } catch (error: any) {
      this.errorMessage = error?.message || 'Call reports could not be loaded.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
      requestAnimationFrame(() => this.renderCharts());
    }
  }

  async loadMore(): Promise<void> {
    if (this.loadingMore || !this.hasMore) return;
    this.loadingMore = true;
    this.errorMessage = '';
    try {
      const result = await this.fetchCallPage(this.calls.length);
      const nextCalls = result.data.serviceCalls ?? [];
      this.calls = [...this.calls, ...nextCalls];
      this.hasMore = nextCalls.length === this.pageSize;
      this.cdr.detectChanges();
      requestAnimationFrame(() => this.renderCharts());
    } catch (error: any) {
      this.errorMessage = error?.message || 'More call records could not be loaded.';
    } finally {
      this.loadingMore = false;
    }
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  private renderCharts(): void {
    if (!this.viewReady || !this.dailyChartCanvas || !this.serviceChartCanvas || !this.calls.length) {
      return;
    }
    this.destroyCharts();

    const daily = new Map<string, number>();
    const services = new Map<string, number>();
    for (const call of this.calls) {
      const date = new Date(call.calledAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      });
      daily.set(date, (daily.get(date) ?? 0) + 1);
      const type = call.serviceType || call.serviceName || 'Other';
      services.set(type, (services.get(type) ?? 0) + 1);
    }

    this.charts.push(
      new Chart(this.dailyChartCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: [...daily.keys()].reverse(),
          datasets: [{ label: 'Calls', data: [...daily.values()].reverse(), backgroundColor: '#2563eb', borderRadius: 7 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { left: 2, right: 6 } },
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, font: { size: 10 } } },
            y: { beginAtZero: true, ticks: { precision: 0, stepSize: 1, font: { size: 10 } } },
          },
        },
      }),
      new Chart(this.serviceChartCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: [...services.keys()],
          datasets: [{ data: [...services.values()], backgroundColor: ['#2563eb', '#0d9488', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'] }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: 4 },
          cutout: '62%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 10, boxHeight: 10, padding: 10, usePointStyle: true, font: { size: 10 } },
            },
          },
        },
      }),
    );
  }

  private fetchCallPage(offset: number) {
    return listProviderCalls({
      providerPhoneNumber: this.loggedInPhoneNumber,
      limit: this.pageSize,
      offset,
    });
  }

  private destroyCharts(): void {
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
  }
}
