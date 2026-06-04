import { Component, inject } from '@angular/core';
import { LoaderServices } from '../../../shared-services/loader-services';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader-component',
  imports: [CommonModule,MatProgressSpinnerModule],
  templateUrl: './loader-component.html',
  styleUrl: './loader-component.css',
})
export class LoaderComponent {
  loaderService = inject(LoaderServices);
  loading$ = this.loaderService.loading$;
}
