import {LinkingOptions} from '@react-navigation/native';
import {SCREEN, MainTabParamList} from './screens';

/**
 * URL shape for every record a link can point at:
 *
 *   bbb://maintenance/MT-40840      → Maintenance tab, detail route
 *   bbb://poi/P-1042                → POI tab, person detail
 *   bbb://work/log/WL-88            → Work tab, work-log detail
 *   bbb://maintenance/new           → Maintenance tab, create form
 *
 * The paths mirror the tab/stack split the app already has, so a link resolves
 * to exactly the same route stack a user would reach by tapping — including
 * the list route underneath, which is what makes back work from a cold start.
 *
 * NOTE: the `bbb` scheme is not registered natively yet. Until it is (iOS:
 * CFBundleURLTypes in Info.plist; Android: an intent-filter on MainActivity),
 * this config is inert — no URL will reach the app for it to resolve. It is
 * wired up first because the route structure is the hard part and it is now
 * stable; registering the scheme is a native-project change to make when push
 * notifications or email links actually need to open a record.
 */
export const linking: LinkingOptions<MainTabParamList> = {
  prefixes: ['bbb://'],
  config: {
    screens: {
      [SCREEN.home]: {
        screens: {
          HomeMain: 'home',
          HomeNotifications: 'notifications',
          HomeRecordView: 'notifications/:kind/:id',
        },
      },
      [SCREEN.work]: {
        screens: {
          WorkList: 'work',
          WorkLogCreate: 'work/log/new',
          WorkLogView: 'work/log/:id',
          WorkMaintenanceView: 'work/maintenance/:id',
          WorkFixtureView: 'work/fixture/:id',
        },
      },
      [SCREEN.maintenance]: {
        screens: {
          MaintenanceList: 'maintenance',
          MaintenanceCreate: 'maintenance/new',
          MaintenanceView: 'maintenance/:id',
        },
      },
      [SCREEN.fixture]: {
        screens: {
          FixtureList: 'fixture',
          FixtureCreate: 'fixture/new',
          FixtureView: 'fixture/:id',
        },
      },
      [SCREEN.incident]: {
        screens: {
          IncidentList: 'incident',
          IncidentCreate: 'incident/new',
          IncidentView: 'incident/:id',
        },
      },
      [SCREEN.dispatch]: {
        screens: {
          DispatchList: 'dispatch',
          DispatchView: 'dispatch/:id',
          DispatchAddIncident: 'dispatch/:dispatchId/incident/new',
          DispatchViewIncident: 'dispatch/:dispatchId/incident/:id',
        },
      },
      [SCREEN.maps]: {
        screens: {
          MapsList: 'maps',
          MapsDownload: 'maps/new',
        },
      },
      [SCREEN.poi]: {
        screens: {
          PoiList: 'poi',
          PoiCreatePerson: 'poi/new',
          PoiCreateInteraction: 'poi/interaction/new',
          PoiCreateUpdate: 'poi/update/new',
          PoiView: 'poi/:id',
        },
      },
    },
  },
};
