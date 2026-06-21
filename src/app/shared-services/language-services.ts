import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class LanguageServices {

  currentLanguage = localStorage.getItem('lang') || 'en';
  translations: any = {};
  languageChange$ = new BehaviorSubject<string>(this.currentLanguage);

  http = inject(HttpClient);

  constructor() {
    this.loadLanguage(this.currentLanguage);
  }

  loadLanguage(lang: string) {
    this.currentLanguage = lang;
    localStorage.setItem('lang', lang);
    this.http
      .get(`assets/lang/${lang}.json`)
      .subscribe((data:any) => {
        this.translations = data;
        this.languageChange$.next(lang);
      });
  }

  translate(key: string): string {
    return this.translations[key] || key;
  }
}
