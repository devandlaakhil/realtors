export interface TractorCard {
  id: string;
  name: string;
  owner: string;
  price: number;
  rating: number;
  distance: string;
  image: string;

  lat: number;
  lng: number;

  top?: string;
  left?: string;
}