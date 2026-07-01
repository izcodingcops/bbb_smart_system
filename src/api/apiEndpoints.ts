export const ApiEndpoints = {
  /****** Auth ******/
  login: 'ambassador/login',
  resetPassword: 'ambassador/resetPassword',
  newPassword: 'ambassador/newPassword',
  otpVerification: 'ambassador/otpVerification',

  /****** Program ******/
  programList: 'work/listPrograms',
  taskList: 'task/list',
  selectProgram: 'program/selectProgram-v2',

  /****** Shift ******/
  startShift: 'shifts/add',

  /****** Location ******/
  addGeoData: 'location/addGeoData?geologs_enabled=true',
  addBulkGeoData: 'location/addBulkGeoData-v2?geologs_enabled=true',

  /****** Navigation ******/
  sideMenu: 'menu/getMenu',

  /****** Home ******/
  taskAndTemplates: 'shifts/homePage',
  homepageWorkAssignList: 'work/listRecent',

  /****** Offline ******/
  uploadFile: 'work/uploadFile',

  /****** Maintenance ******/
  maintenanceBase: 'maintenanceRequest',
  maintenanceList: 'maintenanceRequest/for-app',
  maintenanceDropdowns: 'maintenanceRequest/requestDropdown',
  maintenanceComment: 'maintenanceRequest/addComment',
};
