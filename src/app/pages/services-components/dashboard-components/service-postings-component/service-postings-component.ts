import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import {API_CONSTANTS} from '../../../../constants/realtors-services-api-constants';
import { RealtorsServicesApiServices } from '../../../../api-services/realtors-services-api-services';
import { LoaderServices } from '../../../../shared-services/loader-services';
import { TranslatePipe } from '../../../../pipes/translatepipe-pipe';

@Component({
  selector: 'app-service-postings-component',
  imports: [CommonModule,TranslatePipe],
  templateUrl: './service-postings-component.html',
  styleUrl: './service-postings-component.css',
})
export class ServicePostingsComponent implements OnInit {

  realtorApiSrv = inject(RealtorsServicesApiServices);
  loaderSrv = inject(LoaderServices);

  serviceGroups: any[] = [];


  ngOnInit(): void {
    this.loadMyServices()
  }

  loadMyServices() {
    this.loaderSrv.show();
    forkJoin({
      tractors: this.realtorApiSrv.get(API_CONSTANTS.tractorServices.mylist),
      // cars: this.api.get('/cars'),
      // harvesters: this.api.get('/harvesters'),
      // cultivators: this.api.get('/cultivators'),
    }).subscribe({
      next: (res:any) => {
        this.serviceGroups = [
          {
            category: 'Tractors',
            icon: '🚜',
            items: res.tractors.data,
          },
          // {
          //   category: 'Cars',
          //   icon: '🚗',
          //   items: res.cars.data,
          // },
          // {
          //   category: 'Harvesters',
          //   icon: '🌾',
          //   items: res.harvesters.data,
          // },
          // {
          //   category: 'Cultivators',
          //   icon: '🛠️',
          //   items: res.cultivators.data,
          // },
        ].filter((group) => group.items?.length);
        this.loaderSrv.hide();
      },
      error : () => {
        this.loaderSrv.hide();
      }
    });
  }

  delete(elem:any){

  }

  edit(elem:any){

  }

  toggleStatus(elem:any){

  }
}
