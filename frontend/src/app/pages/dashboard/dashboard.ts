import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  NgZone
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UserReportService } from '../../services/user-report';
import { catchError, finalize, of } from 'rxjs';
import Chart from 'chart.js/auto';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

export interface UserReport {
  userId: number;
  userName: string;
  totalPurchase: number;
  totalSpent: number;
  totalCarbonUsed: number;
  totalCarbonSaved: number;
  ecoBadge: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  private reportSvc = inject(UserReportService);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private ngZone = inject(NgZone);
private baseUrl = `${environment.apiUrl}/api`;

  name = localStorage.getItem('name') ?? 'User';
  role = localStorage.getItem('role')?.replace('ROLE_', '') ?? 'GUEST';

  loading = false;
  error: string | null = null;
  report: UserReport | null = null;

  hasPendingRequest = false;
  requesting = false;
  requestSuccess = false;

  hasPendingSellerRequest = false;
  sellerRequesting = false;
  sellerRequestSuccess = false;

  @ViewChild('savedCanvas') savedCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('usedCanvas') usedCanvas?: ElementRef<HTMLCanvasElement>;

  chartSaved?: Chart;
  chartUsed?: Chart;

  private themeObserver: MutationObserver | null = null;

  private labels: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  private savedData: number[] = [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01];
  private usedData: number[] = [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01];

  ngOnInit(): void {
    this.setupThemeObserver();
    this.loadReport();
    this.fetchWeeklyData();
    window.addEventListener('resize', this.handleResize);
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => this.initCharts());
    });
  }

  ngOnDestroy(): void {
    this.chartSaved?.destroy();
    this.chartUsed?.destroy();
    this.themeObserver?.disconnect();
    window.removeEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    if (!this.savedCanvas || !this.usedCanvas) return;
    this.chartSaved?.destroy();
    this.chartUsed?.destroy();
    this.initCharts();
    this.updateCharts();
  };

  loadReport() {
    this.loading = true;
    this.reportSvc
      .getReport()
      .pipe(
        catchError(() => {
          this.error = 'Failed to load eco report';
          this.toastr.error(this.error);
          return of(null);
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe((res: UserReport | null) => {
        if (!res) return;
        res.totalCarbonUsed = +res.totalCarbonUsed.toFixed(2);
        res.totalCarbonSaved = +res.totalCarbonSaved.toFixed(2);
        res.totalSpent = +res.totalSpent.toFixed(2);
        this.report = res;
      });
  }

  /* ==========================================================
      FETCH WEEKLY DATA
  ========================================================== */
  private fetchWeeklyData() {
    this.http.get<any[]>(`${this.baseUrl}/reports/user/weekly`)
.subscribe({
      next: (data) => {
        const labels = data.map((d) => d.day);
        const saved = data.map((d) => d.saved);
        const used = data.map((d) => d.used);

        this.labels = labels.length ? labels : this.labels;
        this.savedData = saved.length ? saved : this.savedData;
        this.usedData = used.length ? used : this.usedData;

        this.updateCharts();
      },
      error: () => this.updateCharts()
    });
  }

  /* ==========================================================
      INITIALIZE CHARTS
  ========================================================== */
  private initCharts() {
    if (!this.savedCanvas || !this.usedCanvas) return;

    this.chartSaved = this.makeLineChart(
      this.savedCanvas.nativeElement,
      this.labels,
      this.savedData,
      'Carbon Saved (kg)'
    );

    this.chartUsed = this.makeLineChart(
      this.usedCanvas.nativeElement,
      this.labels,
      this.usedData,
      'Carbon Used (kg)'
    );
  }

  /* ==========================================================
      UPDATE CHARTS
  ========================================================== */
  private updateCharts() {
    if (!this.chartSaved || !this.chartUsed) return;

    this.chartSaved.data.labels = this.labels;
    this.chartSaved.data.datasets[0].data = this.savedData;
    this.chartSaved.update();

    this.chartUsed.data.labels = this.labels;
    this.chartUsed.data.datasets[0].data = this.usedData;
    this.chartUsed.update();
  }

  /* ==========================================================
      THEME-AWARE CHART
  ========================================================== */
  private makeLineChart(
    canvas: HTMLCanvasElement,
    labels: string[],
    data: number[],
    label: string
  ): Chart {
    const ctx = canvas.getContext('2d')!;
    const css = getComputedStyle(document.body);

    const line = css.getPropertyValue('--chart-line').trim();
    const fill = css.getPropertyValue('--chart-fill').trim();
    const text = css.getPropertyValue('--chart-text').trim();

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label,
            data,
            borderColor: line,
            backgroundColor: fill,
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            pointRadius: data.some((v) => v > 0) ? 4 : 0,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 10 },
        plugins: {
          legend: { labels: { color: text } }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: text },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          x: {
            ticks: { color: text },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      }
    });
  }

  /* ==========================================================
      THEME CHANGE OBSERVER
  ========================================================== */
  private setupThemeObserver(): void {
    this.themeObserver = new MutationObserver(() => {
      this.chartSaved?.destroy();
      this.chartUsed?.destroy();
      this.initCharts();
      this.updateCharts();
    });

    this.themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  /* ==========================================================
      BADGE COLOR
  ========================================================== */
  getBadgeColor(): string {
    if (!this.report || this.report.totalCarbonSaved <= 0)
      return 'from-gray-600 to-gray-500';

    const badge = this.report.ecoBadge || '';

    if (badge.includes('Eco Legend')) return 'from-yellow-500 to-amber-500';
    if (badge.includes('Green Hero')) return 'from-green-600 to-green-500';
    if (badge.includes('Conscious Shopper')) return 'from-blue-600 to-blue-500';
    if (badge.includes('Beginner')) return 'from-lime-600 to-lime-500';

    return 'from-gray-500 to-gray-400';
  }

  /* ==========================================================
      ADMIN REQUEST
  ========================================================== */
  checkPendingAdminRequest() {
    this.http.get<boolean>(`${this.baseUrl}/admin-request/has-pending`)
.subscribe({
      next: (res) => (this.hasPendingRequest = res),
      error: () => (this.hasPendingRequest = false)
    });
  }

  requestAdminAccess() {
    this.requesting = true;
    this.http.post(`${this.baseUrl}/admin-request/request`, {})
.subscribe({
      next: () => {
        this.requestSuccess = true;
        this.hasPendingRequest = true;
        this.toastr.success('Admin request sent!');
      },
      error: (err: any) => {
        if (err.status === 409) {
          this.hasPendingRequest = true;
          this.toastr.info(err.error?.message || 'You already have a pending admin request');
        } else if (err.status !== 401 && err.status !== 403) {
          this.toastr.error('Request failed. Please try again.');
        }
      },
      complete: () => (this.requesting = false)
    });
  }

  /* ==========================================================
      SELLER REQUEST
  ========================================================== */
  checkPendingSellerRequest() {
    this.http.get<boolean>(`${this.baseUrl}/seller-request/has-pending`)
.subscribe({
      next: (res) => (this.hasPendingSellerRequest = res),
      error: () => (this.hasPendingSellerRequest = false)
    });
  }

  requestSellerAccess() {
    this.sellerRequesting = true;
    this.http.post(`${this.baseUrl}/seller-request/request`, {})
.subscribe({
      next: () => {
        this.sellerRequestSuccess = true;
        this.hasPendingSellerRequest = true;
        this.toastr.success('Seller request sent!');
      },
      error: (err) => {
        if (err.status === 400) {
          this.hasPendingSellerRequest = true;
          this.toastr.info(err.error?.message || 'Request already pending');
        } else {
          this.toastr.error('Request failed');
        }
      },
      complete: () => (this.sellerRequesting = false)
    });
  }
}
