const { createAppointmentRef, listServicesRef, updateUserProfileRef, getUserAppointmentsRef, createServiceCallRef } = require('../');
const { DataConnect, CallerSdkTypeEnum } = require('@angular/fire/data-connect');
const { injectDataConnectQuery, injectDataConnectMutation } = require('@tanstack-query-firebase/angular/data-connect');
const { inject, EnvironmentInjector } = require('@angular/core');

exports.injectCreateAppointment = function injectCreateAppointment(args, injector) {
  return injectDataConnectMutation(createAppointmentRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectListServices = function injectListServices(options, injector) {
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

exports.injectUpdateUserProfile = function injectUpdateUserProfile(args, injector) {
  return injectDataConnectMutation(updateUserProfileRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectGetUserAppointments = function injectGetUserAppointments(options, injector) {
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

exports.injectCreateServiceCall = function injectCreateServiceCall(args, injector) {
  return injectDataConnectMutation(createServiceCallRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

