import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root',
})
export class LanguageServices {

  currentLanguage = 'en';
  translations: any = {};

  http = inject(HttpClient);

  constructor() {
    this.loadLanguage(
      localStorage.getItem('lang') || 'en'
    );
  }

  loadLanguage(lang: string) {
    this.currentLanguage = lang;
    localStorage.setItem('lang', lang);
    this.http
      .get(`assets/lang/${lang}.json`)
      .subscribe((data:any) => {
        this.translations = data;
      });
  }

  translate(key: string): string {
    return this.translations[key] || key;
  }
}