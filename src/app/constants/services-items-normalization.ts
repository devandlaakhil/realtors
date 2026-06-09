export interface ServiceItem {
   id: string;
  title: string;
  image: string;
  location: string;
  price: number;
  unit?: string;
  category: string;
  mobile?: string;
  isActive: boolean;
  originalData: any;
}

export interface ServiceGroup {
  category: string;
  icon: string;
  items: ServiceItem[];
}