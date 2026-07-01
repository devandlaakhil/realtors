import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Appointment_Key {
  id: UUIDString;
  __typename?: 'Appointment_Key';
}

export interface AuditLog_Key {
  id: UUIDString;
  __typename?: 'AuditLog_Key';
}

export interface CreateAppointmentData {
  appointment_insert: Appointment_Key;
}

export interface CreateAppointmentVariables {
  serviceId: UUIDString;
  dateTime: TimestampString;
}

export interface CreateServiceCallData {
  serviceCall_insert: ServiceCall_Key;
}

export interface CreateServiceCallVariables {
  userId: string;
  userName: string;
  userPhoneNumber: string;
  providerName: string;
  providerPhoneNumber: string;
  serviceName: string;
  serviceType: string;
  locationAddress?: string | null;
}

export interface GetUserAppointmentsData {
  appointments: ({
    dateTime: TimestampString;
    status: string;
    service: {
      serviceName: string;
      price: number;
    };
  })[];
}

export interface ListServicesData {
  services: ({
    serviceName: string;
    price: number;
    durationMinutes: number;
    serviceProvider: {
      providerName: string;
      rating?: number | null;
    };
  })[];
}

export interface ServiceCall_Key {
  id: UUIDString;
  __typename?: 'ServiceCall_Key';
}

export interface ServiceProvider_Key {
  id: UUIDString;
  __typename?: 'ServiceProvider_Key';
}

export interface Service_Key {
  id: UUIDString;
  __typename?: 'Service_Key';
}

export interface UpdateUserProfileData {
  user_update?: User_Key | null;
}

export interface UpdateUserProfileVariables {
  name?: string | null;
  phoneNumber?: string | null;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateAppointmentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateAppointmentVariables): MutationRef<CreateAppointmentData, CreateAppointmentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateAppointmentVariables): MutationRef<CreateAppointmentData, CreateAppointmentVariables>;
  operationName: string;
}
export const createAppointmentRef: CreateAppointmentRef;

export function createAppointment(vars: CreateAppointmentVariables): MutationPromise<CreateAppointmentData, CreateAppointmentVariables>;
export function createAppointment(dc: DataConnect, vars: CreateAppointmentVariables): MutationPromise<CreateAppointmentData, CreateAppointmentVariables>;

interface ListServicesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListServicesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListServicesData, undefined>;
  operationName: string;
}
export const listServicesRef: ListServicesRef;

export function listServices(options?: ExecuteQueryOptions): QueryPromise<ListServicesData, undefined>;
export function listServices(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListServicesData, undefined>;

interface UpdateUserProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: UpdateUserProfileVariables): MutationRef<UpdateUserProfileData, UpdateUserProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: UpdateUserProfileVariables): MutationRef<UpdateUserProfileData, UpdateUserProfileVariables>;
  operationName: string;
}
export const updateUserProfileRef: UpdateUserProfileRef;

export function updateUserProfile(vars?: UpdateUserProfileVariables): MutationPromise<UpdateUserProfileData, UpdateUserProfileVariables>;
export function updateUserProfile(dc: DataConnect, vars?: UpdateUserProfileVariables): MutationPromise<UpdateUserProfileData, UpdateUserProfileVariables>;

interface GetUserAppointmentsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserAppointmentsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserAppointmentsData, undefined>;
  operationName: string;
}
export const getUserAppointmentsRef: GetUserAppointmentsRef;

export function getUserAppointments(options?: ExecuteQueryOptions): QueryPromise<GetUserAppointmentsData, undefined>;
export function getUserAppointments(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserAppointmentsData, undefined>;

interface CreateServiceCallRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateServiceCallVariables): MutationRef<CreateServiceCallData, CreateServiceCallVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateServiceCallVariables): MutationRef<CreateServiceCallData, CreateServiceCallVariables>;
  operationName: string;
}
export const createServiceCallRef: CreateServiceCallRef;

export function createServiceCall(vars: CreateServiceCallVariables): MutationPromise<CreateServiceCallData, CreateServiceCallVariables>;
export function createServiceCall(dc: DataConnect, vars: CreateServiceCallVariables): MutationPromise<CreateServiceCallData, CreateServiceCallVariables>;

