export const SUPABASE_TABLES = {
  servicePosts: 'service_posts',
  serviceCalls: 'service_calls',
  profiles: 'profiles',
  homeRepairServices: 'home_repair_services',
  skilledWorkers: 'skilled_workers',
  beautyWellnessServices: 'beauty_wellness_services',
  educationServices: 'education_services',
  transportVehicles: 'transport_vehicles'
} as const;

export const SUPABASE_SERVICE_TYPES = {
  beautyWellness: 'beauty_wellness',
  education: 'education',
  worker: 'worker',
  transport: 'transport',
  commercialVehicle: 'commercial_vehicle',
  homeRepair: 'home_repair',
  driver: 'driver'
} as const;

export type SupabaseServiceType =
  typeof SUPABASE_SERVICE_TYPES[keyof typeof SUPABASE_SERVICE_TYPES];
