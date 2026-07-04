export const API_CONSTANTS = {
  commercialVehicleServices: {
    save: 'create-commercial-vehicle-service',
    list: 'get-commercial-vehicle-services',
    mylist: 'get-my-commercial-vehicles-list',
    getSingleItem: 'get-single-commercial-vehicle',
    updateItem: 'update-commercial-vehicle',
    delete: 'delete-commercial-vehicle-service',
    statusUpdate: 'update-commercial-vehicle-status',
  },
  workerapiServices: {
    save : 'worker-register',
    getAll : 'get-all-workers',
    getMyPostings : 'get-my-worker-postings',
    statusUpdate : 'update-worker-status',
    getSingleItem : 'get-single-worker',
    delete : 'delete-worker',
    update : 'update-worker',
  },
  transportApiService : {
    save : 'vechile-regitration',
    getNearByVehicles : "getnearvechicles",
    getMyVehiclePosts : "get-my-vehicles",
    updateVehicleStatus : "update-my-status",
    delete : 'delete-vehicle',
    getSingleVehicle : 'get-singal-vehicle',
    updateVehicle : 'updateVehicle'
  },
  hardwareShopApiService : {
    getSingleShop : 'get-single-shop',
    deleteShop : 'delete-shop',
    deactivate:'update-shop-status'
  }
};
