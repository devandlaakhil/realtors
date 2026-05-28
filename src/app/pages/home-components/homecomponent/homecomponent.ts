import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { RealEstateApiService } from '../../../api-services/realestate-api-services';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-homecomponent',
  imports: [
    CommonModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './homecomponent.html',
  styleUrl: './homecomponent.css',
})
export class Homecomponent implements OnInit {
  properties: any[] = [];
  filteredProperties: any[] = [];
  realEstateApiSrv = inject(RealEstateApiService);
  destroy$ = new Subject<any>();
  toastr = inject(ToastrService);
  cdr = inject(ChangeDetectorRef);
  selectedType: string = '';
  selectedBudget: string = '';

  ngOnInit(): void {
    this.getAllProperites();
  }

  getAllProperites() {
    this.realEstateApiSrv
      .getAllList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.properties = res.data;
          this.filteredProperties = [...this.properties];
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastr.error('Something went wrong', 'Fail');
        },
      });
  }

  getMainImage(images: any[]): string {
    if (!images || images.length === 0) {
      return '';
    }
    const mainImage = images.find((img) => img.type === 'main');
    const image = mainImage?.url || images[0]?.url;
    return image;
  }

  onTypeChange(type: string) {
    this.selectedType = type;
    this.filterProperties();
  }

  onBudgetChange(budget: string) {
    this.selectedBudget = budget;
    this.filterProperties();
  }

  filterProperties() {
    this.filteredProperties = this.properties.filter((property: any) => {
      // Property Type Filter
      const matchesType =
        !this.selectedType ||
        property.propertyType?.toLowerCase() === this.selectedType.toLowerCase();

      // Budget Filter
      const priceInLakhs = property.price / 100000; // convert to Lakhs

      let matchesBudget = true;

      switch (this.selectedBudget) {
        case '10-50':
          matchesBudget = priceInLakhs >= 10 && priceInLakhs <= 50;
          break;

        case '50-100':
          matchesBudget = priceInLakhs > 50 && priceInLakhs <= 100;
          break;

        case '100+':
          matchesBudget = priceInLakhs > 100;
          break;
      }

      return matchesType && matchesBudget;
    });
  }
}
