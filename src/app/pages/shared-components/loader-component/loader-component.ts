import { Component, inject } from '@angular/core';
import { LoaderServices } from '../../../shared-services/loader-services';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader-component',
  imports: [CommonModule],
  templateUrl: './loader-component.html',
  styleUrl: './loader-component.css',
})
export class LoaderComponent {
  loaderService = inject(LoaderServices);
  loading$ = this.loaderService.loading$;
  skeletonCards = Array.from({ length: 6 });
}
