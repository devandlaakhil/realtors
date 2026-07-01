import { createAppointmentRef, listServicesRef, updateUserProfileRef, getUserAppointmentsRef, createServiceCallRef } from '../../';
import { DataConnect, CallerSdkTypeEnum } from '@angular/fire/data-connect';
import { injectDataConnectQuery, injectDataConnectMutation } from '@tanstack-query-firebase/angular/data-connect';
import { inject, EnvironmentInjector } from '@angular/core';
export function injectCreateAppointment(args, injector) {
  return injectDataConnectMutation(createAppointmentRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectListServices(options, injector) {
  const finalInjector = injector || inject(EnvironmentInjector);
  const dc = finalInjector.get(DataConnect);
  return injectDataConnectQuery(() => {
    const addOpn = options && options();
    return {
      queryFn: () =>  listServicesRef(dc),
      ...addOpn
    };
  }, finalInjector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectUpdateUserProfile(args, injector) {
  return injectDataConnectMutation(updateUserProfileRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectGetUserAppointments(options, injector) {
  const finalInjector = injector || inject(EnvironmentInjector);
  const dc = finalInjector.get(DataConnect);
  return injectDataConnectQuery(() => {
    const addOpn = options && options();
    return {
      queryFn: () =>  getUserAppointmentsRef(dc),
      ...addOpn
    };
  }, finalInjector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectCreateServiceCall(args, injector) {
  return injectDataConnectMutation(createServiceCallRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

