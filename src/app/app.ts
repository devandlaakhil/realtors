import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../app/pages/header-components/header-component/header-component';
import { LoaderComponent } from './pages/shared-components/loader-component/loader-component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet,HeaderComponent,LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('realtors');
}
