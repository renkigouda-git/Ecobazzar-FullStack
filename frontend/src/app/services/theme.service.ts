import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private readonly STORAGE_KEY = 'ecobazaar-theme';

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

    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  loadTheme() {
    const saved = localStorage.getItem(this.STORAGE_KEY);

    if (saved) {
      this.setTheme(saved);
    }
  }

}
