import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSpinnerModule } from 'ngx-spinner';

import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgxSpinnerModule, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  protected readonly title = signal('ecobazaar-frontend');

  constructor(private themeService: ThemeService) {
    // 🔥 APPLY SAVED THEME ON APP LOAD
    this.themeService.loadTheme();
  }
}
