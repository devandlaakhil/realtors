export interface CityCoordinate {
  lat: number;
  lng: number;
}

export const CITY_COORDINATES: Record<string, CityCoordinate> = {
  Hyderabad: {
    lat: 17.385044,
    lng: 78.486671,
  },

  Guntur: {
    lat: 16.3067,
    lng: 80.4365,
  },

  Ongole: {
    lat: 15.5057,
    lng: 80.0499,
  },

  Vijayawada: {
    lat: 16.5062,
    lng: 80.648,
  },

  Tirupati: {
    lat: 13.6288,
    lng: 79.4192,
  },

  Vizag: {
    lat: 17.6868,
    lng: 83.2185,
  },
  Kukatpally: {
    lat:17.4949,
    lng:78.3997
  }
};