import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { NgIf } from '@angular/common';
import { Subject, filter, takeUntil } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    NgIf
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  cartCount = 0;

  ngOnInit(): void {
    this.updateCartCountIfNeeded();

    this.auth.loggedIn$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateCartCountIfNeeded();
    });

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => this.updateCartCountIfNeeded());

    const saved = localStorage.getItem('theme');
    if (saved) this.setTheme(saved);
  }

  private updateCartCountIfNeeded(): void {
    if (this.auth.isUser() && this.auth.isLoggedIn()) {
      this.loadCartCount();
    } else {
      this.cartCount = 0;
    }
  }

  private loadCartCount(): void {
    this.cartService.getSummary().subscribe({
      next: (res: any) => {
        this.cartCount = Array.isArray(res?.items) ? res.items.length : 0;
      },
      error: () => (this.cartCount = 0)
    });
  }

  logout(): void {
    this.auth.logout();
    this.cartCount = 0;
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ======================================================
     🔥 MASTER THEME SWITCHER — ALL 10 THEMES
  ====================================================== */
  setTheme(theme: string) {
    const themes = [
      'theme-snow',
      'theme-azure',
      'theme-forest',
      'theme-rose',
      'theme-neon-pink',
      'theme-neon-blue',
      'theme-dark-purple',
      'theme-dark-ocean',
      'theme-amoled'
    ];

    document.body.classList.remove(...themes);
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }

  /* Theme Menu List */
  themes = [
    { id: 'theme-snow', label: 'Snow' },
    { id: 'theme-azure', label: 'Azure' },
    { id: 'theme-forest', label: 'Forest' },
    { id: 'theme-rose', label: 'Rose' },

    { id: 'theme-neon-pink', label: 'Neon Pink' },
    { id: 'theme-neon-blue', label: 'Neon Blue' },

    { id: 'theme-dark-purple', label: 'Dark Purple' },
    { id: 'theme-dark-ocean', label: 'Dark Ocean' },
    { id: 'theme-amoled', label: 'Amoled Black' }
  ];
}
