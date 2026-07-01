import { CreateAppointmentData, CreateAppointmentVariables, ListServicesData, UpdateUserProfileData, UpdateUserProfileVariables, GetUserAppointmentsData, CreateServiceCallData, CreateServiceCallVariables } from '../';
import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise} from '@angular/fire/data-connect';
import { CreateQueryResult, CreateMutationResult} from '@tanstack/angular-query-experimental';
import { CreateDataConnectQueryResult, CreateDataConnectQueryOptions, CreateDataConnectMutationResult, DataConnectMutationOptionsUndefinedMutationFn } from '@tanstack-query-firebase/angular/data-connect';
import { FirebaseError } from 'firebase/app';
import { Injector } from '@angular/core';

type CreateAppointmentOptions = DataConnectMutationOptionsUndefinedMutationFn<CreateAppointmentData, FirebaseError, CreateAppointmentVariables>;
export function injectCreateAppointment(options?: CreateAppointmentOptions, injector?: Injector): CreateDataConnectMutationResult<CreateAppointmentData, CreateAppointmentVariables, CreateAppointmentVariables>;

export type ListServicesOptions = () => Omit<CreateDataConnectQueryOptions<ListServicesData, undefined>, 'queryFn'>;
export function injectListServices(options?: ListServicesOptions, injector?: Injector): CreateDataConnectQueryResult<ListServicesData, undefined>;

type UpdateUserProfileOptions = DataConnectMutationOptionsUndefinedMutationFn<UpdateUserProfileData, FirebaseError, UpdateUserProfileVariables | void>;
export function injectUpdateUserProfile(options?: UpdateUserProfileOptions, injector?: Injector): CreateDataConnectMutationResult<UpdateUserProfileData, UpdateUserProfileVariables, UpdateUserProfileVariables | void>;

export type GetUserAppointmentsOptions = () => Omit<CreateDataConnectQueryOptions<GetUserAppointmentsData, undefined>, 'queryFn'>;
export function injectGetUserAppointments(options?: GetUserAppointmentsOptions, injector?: Injector): CreateDataConnectQueryResult<GetUserAppointmentsData, undefined>;

type CreateServiceCallOptions = DataConnectMutationOptionsUndefinedMutationFn<CreateServiceCallData, FirebaseError, CreateServiceCallVariables>;
export function injectCreateServiceCall(options?: CreateServiceCallOptions, injector?: Injector): CreateDataConnectMutationResult<CreateServiceCallData, CreateServiceCallVariables, CreateServiceCallVariables>;
