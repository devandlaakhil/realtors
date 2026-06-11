import { ServiceItem } from './services-items-normalization';

export function mapTractor(item: any): ServiceItem {
  return {
    id: item.id,
    title: item.ownerName,
    image: item.images?.[0]?.url || '/assets/images/tractor.png',
    location: `${item.location?.village || ''}, ${item.location?.district || ''}`,
    price: item.pricePerHour,
    unit: 'hour',
    category: 'Tractor',
    mobile: item.mobileNumber,
    originalData: item,
    isActive: item.status === 'ACTIVE',
  };
}

export function mapWorker(item: any): ServiceItem {
  return {
    id: item.id,
    title: item.name,
    image: item.image?.[0]?.url || '/assets/images/avatar.png',
    location: `${item.village || ''}, ${item.district || ''}`,
    price: item.price,
    unit: item.unit || 'day',
    category: 'Worker',
    mobile: item.mobile,
    originalData: item,
    isActive: item.isActive,
  };
}

export function mapVehicle(item:any): ServiceItem {
  return {
    id: item.id,
    title: item.name,
    image: item.images[0]?.url || '/assets/images/avatar.png',
    location: `${item.village || ''}, ${item.district || ''}`,
    price: item.price,
    unit: item.pricingType || 'day',
    category: 'Vehicles',
    mobile: item.mobile,
    originalData: item,
    isActive: item.isActive,
  };
}