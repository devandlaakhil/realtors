export function mapToServiceCard(item: any, category: string) {
  return {
    id: item.id,
    name: item.name,
    category,
    rating: item.originalData?.averageRating ?? item.originalData?.rating ?? 0,
    distance: item.originalData?.distanceKm ? `${item.originalData.distanceKm.toFixed(2)} km` : '',
    owner: item.originalData?.ownerName ?? item.originalData?.name ?? '',
    price: item.price,
    unit: item.unit,
    image: item.image,
    mobile: item.mobile,
    location: item.location ?? '',
  };
}

export const mapCardItems:any = [
    {
      name: '',
      category: '',
      distance: '',
      owner: '',
      price: 0,
      image: '',
      unit: '',
      location: '',
      mobile: '',
    },
]
