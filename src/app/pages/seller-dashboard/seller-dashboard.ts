import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Chart from 'chart.js/auto';
import { ToastrService } from 'ngx-toastr';
import { ProductService } from '../../services/product';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './seller-dashboard.html'
})
export class SellerDashboard implements OnInit, OnDestroy {
  private productSvc = inject(ProductService);
  private reportSvc = inject(ReportService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  products: any[] = [];
  loading = true;
  error: string | null = null;
  stats = { total: 0, certified: 0, requested: 0, orders: 0, revenue: 0 };
  badge: string | null = null;

  @ViewChild('salesChart') salesChart!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;
  private themeObserver: MutationObserver | null = null;

  // store last chart data so we can recolor when theme changes
  private lastLabels: string[] = [];
  private lastValues: number[] = [];

  ngOnInit(): void {
    this.load();
    this.observeThemeChange();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.themeObserver?.disconnect();
  }

  /* ---------------------------------------------------------
     THEME PALETTE (no CSS vars, only body classes)
  --------------------------------------------------------- */
  private getPalette() {
    const body = document.body;
    const darkThemes = [
      'theme-dark-purple',
      'theme-dark-ocean',
      'theme-amoled',
      'theme-neon-blue',
      'theme-neon-green',
      'theme-neon-pink'
    ];

    const isDark = darkThemes.some((t) => body.classList.contains(t));

    if (isDark) {
      // DARK / NEON THEMES
      return {
        bar: '#22c55e',              // bright green bar
        barIdle: '#27272f',          // empty-day bar
        grid: 'rgba(255,255,255,0.20)',
        text: '#f9fafb',             // almost white
        tooltipBg: '#111827'
      };
    }

    // LIGHT THEMES
    return {
      bar: '#059669',
      barIdle: '#e5e7eb',
      grid: '#d1d5db',
      text: '#111827',
      tooltipBg: '#064e3b'
    };
  }

  /* ---------------------------------------------------------
     WATCH THEME CHANGES → recolor chart
  --------------------------------------------------------- */
  private observeThemeChange() {
    this.themeObserver = new MutationObserver(() => {
      if (!this.chart) return;
      // just re-render with same data but new palette
      this.renderChartFromStoredData();
    });

    this.themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  /* ---------------------------------------------------------
     LOAD DASHBOARD DATA
  --------------------------------------------------------- */
  load() {
    this.loading = true;
    this.error = null;

    forkJoin([
      this.productSvc.getSellerProducts().pipe(catchError(() => of([]))),
      this.reportSvc.getSellerReport().pipe(catchError(() => of(null))),
      this.reportSvc.getSellerSales(14).pipe(catchError(() => of([])))
    ]).subscribe({
      next: ([productsRes, reportRes, salesRes]: any) => {
        this.products = productsRes || [];
        this.stats.total = this.products.length;
        this.stats.certified = this.products.filter((p: any) => p.ecoCertified).length;
        this.stats.requested = this.products.filter(
          (p: any) => p.ecoRequested && !p.ecoCertified
        ).length;
        this.stats.orders = Number(reportRes?.totalOrders ?? 0);
        this.stats.revenue = Number(reportRes?.totalRevenue ?? 0);
        this.badge = reportRes?.ecoSellerBadge ?? reportRes?.badge ?? 'New Seller';

        this.loading = false;
        setTimeout(() => this.renderChart(salesRes || []), 0);
      },
      error: () => {
        this.error = 'Failed to load dashboard';
        this.loading = false;
      }
    });
  }

  /** Local YYYY-MM-DD (e.g. 2025-12-02) */
  private toLocalYMD(d: Date): string {
    return d.toLocaleDateString('en-CA');
  }

  /* ---------------------------------------------------------
     BUILD CHART DATA FROM API RESULT
  --------------------------------------------------------- */
  private renderChart(rawData: any[]) {
    if (!this.salesChart) return;
    const ctx = this.salesChart.nativeElement.getContext('2d');
    if (!ctx) return;

    // map date -> revenue
    const revenueMap = new Map<string, number>();
    rawData.forEach((item) => {
      const raw = item.day || item.date || '';
      const dateStr = raw.includes('T') ? raw.split('T')[0] : raw;
      if (dateStr) {
        revenueMap.set(dateStr, Number(item.revenue || 0));
      }
    });

    const today = new Date();
    const labels: string[] = [];
    const values: number[] = [];

    // last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = this.toLocalYMD(d);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      values.push(revenueMap.get(key) ?? 0);
    }

    this.lastLabels = labels;
    this.lastValues = values;

    this.renderChartFromStoredData();
  }

  /* ---------------------------------------------------------
     ACTUAL CHART RENDER (uses stored labels/values + palette)
  --------------------------------------------------------- */
  private renderChartFromStoredData() {
    if (!this.salesChart) return;
    const ctx = this.salesChart.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart?.destroy();

    const labels = this.lastLabels;
    const values = this.lastValues;

    const palette = this.getPalette();

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: values.map((v) => (v > 0 ? palette.bar : palette.barIdle)),
            borderColor: palette.bar,
            borderWidth: 2,
            borderRadius: 10,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: palette.tooltipBg,
            titleColor: '#ffffff',
            bodyColor: '#f9fafb',
            callbacks: {
              label: (ctx) => `Revenue: ₹${ctx.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: palette.text,
              callback: (value) => '₹' + Number(value).toLocaleString()
            },
            grid: {
              color: palette.grid,
              lineWidth: 1.2
            }
          },
          x: {
            ticks: {
              color: palette.text
            },
            grid: {
              color: palette.grid,
              lineWidth: 0.8
            }
          }
        }
      }
    });
  }

  /* ---------------------------------------------------------
     NAV + CRUD
  --------------------------------------------------------- */
  goAdd(): void {
    this.router.navigate(['/seller/product']);
  }

  edit(product: any): void {
    this.router.navigate(['/seller/product'], { state: { product } });
  }

  deleteProduct(id: number): void {
    if (!confirm('Are you sure you want to delete this product?')) return;

    this.productSvc.delete(id).subscribe({
      next: () => {
        this.products = this.products.filter((p) => p.id !== id);
        this.stats.total = this.products.length;
        this.toastr.success('Product deleted successfully');
        this.load();
      },
      error: () => this.toastr.error('Failed to delete product')
    });
  }
}
