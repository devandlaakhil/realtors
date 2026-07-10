export interface TractorCard {
  id: string;
  name: string;
  owner: string;
  price: number;
  rating: number;
  distance: string;
  image: string;
  mobile: string;
  vehicleType?: string;
  brand?: string;
  model?: string;
  pricePerAcre?: number;
  minimumBookingHours?: number;
  description?: string;
  village?: string;
  mandal?: string;
  district?: string;
  registrationNumber?: string;
  addOns?: {
    label: string;
    icon: string;
  }[];

  lat: number;
  lng: number;

  top?: string;
  left?: string;
}
