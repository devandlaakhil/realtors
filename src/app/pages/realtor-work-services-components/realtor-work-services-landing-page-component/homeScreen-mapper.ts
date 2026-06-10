export function mapToServiceCard(item: any, category: string) {
  return {
    id: item.id,
    name: item.title,
    category,
    rating: item.originalData?.averageRating ?? item.originalData?.rating ?? 0,
    distance: item.originalData?.distanceKm
      ? `${item.originalData.distanceKm.toFixed(2)} km`
      : '',
    owner: item.originalData?.ownerName ?? item.originalData?.name ?? '',
    price: item.price,
    unit: item.unit,
    image: item.image,
    mobile: item.mobile,
    location: item.location ?? '',
  };
}