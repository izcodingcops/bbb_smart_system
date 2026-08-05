import assert from 'node:assert/strict';
import {graphql} from 'graphql';
import {mockSchema} from '../src/graphql/mockSchema';
import {DATE_RANGE_OPTIONS, matchesDateRange} from '../src/utils/dateRange';

type Check = [name: string, run: () => Promise<void> | void];

const run = (source: string, variableValues?: Record<string, unknown>, token: string | null = null) =>
  graphql({schema: mockSchema, source, variableValues, contextValue: {token}});

const LOGIN = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      __typename
      ... on AuthSession { token user { id enableShiftEntry programs { id } } shiftTypes { id } }
      ... on InvalidCredentials { message }
    }
  }
`;

const checks: Check[] = [
  ['schema builds', () => {
    assert.ok(mockSchema.getQueryType());
    assert.ok(mockSchema.getMutationType());
  }],

  ['login rejects a bad password as a union member, not an error', async () => {
    const r: any = await run(LOGIN, {input: {username: 'johndoe', password: 'wrong', loginType: 1}});
    assert.equal(r.errors, undefined);
    assert.equal(r.data.login.__typename, 'InvalidCredentials');
  }],

  ['login returns a session with programs and shift types', async () => {
    const r: any = await run(LOGIN, {input: {username: 'johndoe', password: 'password123', loginType: 1}});
    assert.equal(r.errors, undefined);
    assert.equal(r.data.login.__typename, 'AuthSession');
    assert.equal(r.data.login.user.enableShiftEntry, true);
    assert.ok(r.data.login.user.programs.length > 0);
    assert.ok(r.data.login.shiftTypes.length > 0);
  }],

  ['me resolves from the bearer token', async () => {
    const login: any = await run(LOGIN, {input: {username: 'johndoe', password: 'password123', loginType: 1}});
    const token = login.data.login.token;
    const me: any = await run('query Me { me { id name } }', undefined, token);
    assert.equal(me.data.me.id, '1');
    const anon: any = await run('query Me { me { id } }');
    assert.equal(anon.data.me, null);
  }],

  ['menu items come back camelCase with enum positions', async () => {
    const r: any = await run('query M { menuItems { id menuName screenName menuIcon position } }');
    assert.equal(r.errors, undefined);
    assert.ok(r.data.menuItems.length > 0);
    assert.ok(['BOTTOM', 'MORE'].includes(r.data.menuItems[0].position));
  }],

  ['work items and quick actions require a programId', async () => {
    const r: any = await run(
      'query W($p: ID!) { workItems(programId: $p) { id status priority bucket } quickActions(programId: $p) { id label } }',
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    assert.ok(r.data.workItems.length > 0);
    assert.ok(r.data.quickActions.length > 0);
  }],

  ['equipment returns ISO timestamps', async () => {
    const r: any = await run('query E($p: ID!) { checkedInEquipment(programId: $p) { id checkedInAt status } }', {p: 'p1'});
    assert.equal(r.errors, undefined);
    assert.ok(!Number.isNaN(Date.parse(r.data.checkedInEquipment[0].checkedInAt)), 'checkedInAt must parse as a date');
  }],

  ['maintenance accepts a filter argument even though the mock ignores it', async () => {
    const r: any = await run(
      'query M($p: ID!, $f: MaintenanceFilter) { maintenanceRequests(programId: $p, filter: $f) { id status priority queuedOffline } }',
      {p: 'p1', f: {statuses: ['OPEN']}},
    );
    assert.equal(r.errors, undefined);
    assert.ok(r.data.maintenanceRequests.length > 0);
  }],

  ['maintenance list records expose completedBy', async () => {
    const r: any = await run(
      'query L($p: ID!) { maintenanceRequests(programId: $p) { reference status completedBy } }',
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    const done = r.data.maintenanceRequests.find((m: any) => m.reference === '#MT-40840');
    assert.equal(done.completedBy, 'Marcus Bell');
    const open = r.data.maintenanceRequests.find((m: any) => m.reference === '#MT-40855');
    assert.equal(open.completedBy, null);
  }],

  ['maintenance detail resolves every section', async () => {
    const r: any = await run(
      `query D($id: ID!) { maintenanceRequest(id: $id) {
        reference type status priority completedBy completedOn
        ambassador programName programCode createdBy paid assigneeKind department
        address zone describeLocation description documents
        fixture incidents pois equipment
        comments { id createdAt text edited images }
      } }`,
      {id: 'mt_40840'},
    );
    assert.equal(r.errors, undefined);
    const d = r.data.maintenanceRequest;
    assert.equal(d.completedBy, 'Marcus Bell');
    assert.equal(d.paid, true);
    assert.equal(d.assigneeKind, 'SUPERVISOR');
    assert.ok(Array.isArray(d.comments));
    assert.ok(d.comments.length >= 1);
    const missing: any = await run(
      'query D($id: ID!) { maintenanceRequest(id: $id) { reference } }',
      {id: 'mt_00000'},
    );
    assert.equal(missing.data.maintenanceRequest, null);
  }],

  // NB: the mock store is module-level and these checks share one process, so
  // a mutation here is visible to every check that runs after it. #MT-40801 is
  // used only by this check for that reason.
  ['maintenance status flows set completedBy and completedOn', async () => {
    const set = (id: string, status: string) => run(
      'mutation S($id: ID!, $s: MaintenanceStatus!) { setMaintenanceStatus(id: $id, status: $s) { reference status completedBy completedOn } }',
      {id, s: status},
    );
    // #MT-40801 starts Open with Alex Nguyen assigned.
    const prog: any = await set('mt_40801', 'IN_PROGRESS');
    assert.equal(prog.errors, undefined);
    assert.equal(prog.data.setMaintenanceStatus.status, 'IN_PROGRESS');
    assert.equal(prog.data.setMaintenanceStatus.completedBy, null);
    const done: any = await set('mt_40801', 'COMPLETED');
    assert.equal(done.data.setMaintenanceStatus.status, 'COMPLETED');
    assert.equal(done.data.setMaintenanceStatus.completedBy, 'Alex Nguyen');
    assert.ok(done.data.setMaintenanceStatus.completedOn);
  }],

  ['maintenance create, update and delete round-trip through the store', async () => {
    const INPUT = {
      type: 'Bench Repair', requestedAt: '2026-07-07T09:00:00',
      assigneeKind: 'SUPERVISOR', department: null, priority: 'HIGH',
      address: '16th St Mall, Denver, CO 80202', zone: 'Zone 2',
      describeLocation: 'North entrance', businessName: '16th St Mall',
      description: 'Loose slats', documents: [], fixture: 'Bench #B-204',
      incidents: [], pois: [], equipment: ['Hammer'],
    };
    const created: any = await run(
      'mutation C($p: ID!, $i: MaintenanceRequestInput!) { createMaintenanceRequest(programId: $p, input: $i) { id reference status fixture equipment } }',
      {p: 'p1', i: INPUT},
    );
    assert.equal(created.errors, undefined);
    const id = created.data.createMaintenanceRequest.id;
    const ref = created.data.createMaintenanceRequest.reference;
    assert.ok(ref.startsWith('#MT-'));
    assert.equal(created.data.createMaintenanceRequest.status, 'OPEN');
    assert.equal(created.data.createMaintenanceRequest.fixture, 'Bench #B-204');

    const updated: any = await run(
      'mutation U($id: ID!, $i: MaintenanceRequestInput!) { updateMaintenanceRequest(id: $id, input: $i) { reference priority zone } }',
      {id, i: {...INPUT, priority: 'LOW', zone: 'Zone 5'}},
    );
    assert.equal(updated.errors, undefined);
    assert.equal(updated.data.updateMaintenanceRequest.priority, 'LOW');
    assert.equal(updated.data.updateMaintenanceRequest.zone, 'Zone 5');

    const deleted: any = await run(
      'mutation D($id: ID!) { deleteMaintenanceRequest(id: $id) }', {id},
    );
    assert.equal(deleted.errors, undefined);
    assert.equal(deleted.data.deleteMaintenanceRequest, id);
    const gone: any = await run(
      'query G($id: ID!) { maintenanceRequest(id: $id) { reference } }', {id},
    );
    assert.equal(gone.data.maintenanceRequest, null);
  }],

  ['maintenance form options serve every dropdown', async () => {
    const r: any = await run(
      'query O($p: ID!) { maintenanceFormOptions(programId: $p) { nextReference types zones departments businessNames fixtures incidents pois equipment fixtureTypes } }',
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    const o = r.data.maintenanceFormOptions;
    assert.ok(o.nextReference.startsWith('#MT-'));
    assert.equal(o.types.length, 10);
    assert.equal(o.zones.length, 6);
    // fixtures is served from fixtureStore titles alone — one source of truth.
    assert.ok(o.fixtures.includes('16th St Floor Fixture'));
    assert.equal(o.fixtureTypes.length, 10);
  }],

  ['maintenance comments add, edit and delete', async () => {
    const added: any = await run(
      'mutation A($id: ID!, $t: String!, $img: [String!]) { addMaintenanceComment(requestId: $id, text: $t, images: $img) { id text edited images } }',
      {id: 'mt_40877', t: 'Fixed the loose panel', img: ['file:///tmp/a.jpg']},
    );
    assert.equal(added.errors, undefined);
    assert.equal(added.data.addMaintenanceComment.edited, false);
    assert.equal(added.data.addMaintenanceComment.images.length, 1);
    const cid = added.data.addMaintenanceComment.id;

    const edited: any = await run(
      'mutation E($id: ID!, $cid: ID!, $t: String!) { updateMaintenanceComment(requestId: $id, commentId: $cid, text: $t) { text edited } }',
      {id: 'mt_40877', cid, t: 'Fixed and photographed'},
    );
    assert.equal(edited.data.updateMaintenanceComment.edited, true);

    const removed: any = await run(
      'mutation R($id: ID!, $cid: ID!) { deleteMaintenanceComment(requestId: $id, commentId: $cid) }',
      {id: 'mt_40877', cid},
    );
    assert.equal(removed.data.deleteMaintenanceComment, cid);
  }],

  ['fixture list resolves', async () => {
    const r: any = await run(
      'query F($p: ID!) { fixtures(programId: $p) { reference status queuedOffline } }',
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    assert.ok(r.data.fixtures.length > 0);
  }],

  ['fixture detail resolves every section', async () => {
    const r: any = await run(
      `query D($id: ID!) { fixture(id: $id) {
        reference title fixtureType zone status createdBy { name initials }
        queuedOffline createdAt address
        describeLocation latitude longitude description documents
      } }`,
      {id: 'fx_42984'},
    );
    assert.equal(r.errors, undefined);
    const d = r.data.fixture;
    assert.equal(d.title, '16th St Floor Fixture');
    assert.equal(d.createdBy.name, 'You');
    assert.ok(d.latitude);
    const missing: any = await run(
      'query D($id: ID!) { fixture(id: $id) { reference } }',
      {id: 'fx_00000'},
    );
    assert.equal(missing.data.fixture, null);
  }],

  // NB: shares the module-level store with every other check — #FX-42984 is
  // restored to ACTIVE at the end so later checks see its original state.
  ['fixture status toggles both directions', async () => {
    const set = (status: string) => run(
      'mutation S($id: ID!, $s: FixtureStatus!) { setFixtureStatus(id: $id, status: $s) { reference status } }',
      {id: 'fx_42984', s: status},
    );
    const off: any = await set('INACTIVE');
    assert.equal(off.errors, undefined);
    assert.equal(off.data.setFixtureStatus.status, 'INACTIVE');
    const on: any = await set('ACTIVE');
    assert.equal(on.data.setFixtureStatus.status, 'ACTIVE');
  }],

  ['fixture create, update and delete round-trip through the store', async () => {
    const INPUT = {
      title: 'Test Bench', serviceDateTime: '2026-07-07T09:00:00', fixtureType: 'Bench',
      status: 'ACTIVE', address: '16th St Mall, Denver, CO 80202', zone: 'Zone 2',
      describeLocation: 'North entrance', description: 'Brand new', documents: [],
    };
    const created: any = await run(
      'mutation C($p: ID!, $i: FixtureInput!) { createFixture(programId: $p, input: $i) { id reference status } }',
      {p: 'p1', i: INPUT},
    );
    assert.equal(created.errors, undefined);
    const id = created.data.createFixture.id;
    const ref = created.data.createFixture.reference;
    assert.ok(ref.startsWith('#FX-'));
    assert.equal(created.data.createFixture.status, 'ACTIVE');

    const updated: any = await run(
      'mutation U($id: ID!, $i: FixtureInput!) { updateFixture(id: $id, input: $i) { reference zone } }',
      {id, i: {...INPUT, zone: 'Zone 6'}},
    );
    assert.equal(updated.errors, undefined);
    assert.equal(updated.data.updateFixture.zone, 'Zone 6');

    const deleted: any = await run(
      'mutation D($id: ID!) { deleteFixture(id: $id) }', {id},
    );
    assert.equal(deleted.data.deleteFixture, id);
    const gone: any = await run(
      'query G($id: ID!) { fixture(id: $id) { reference } }', {id},
    );
    assert.equal(gone.data.fixture, null);
  }],

  ['fixture form options serve every dropdown', async () => {
    const r: any = await run(
      'query O($p: ID!) { fixtureFormOptions(programId: $p) { nextReference fixtureTypes zones } }',
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    const o = r.data.fixtureFormOptions;
    assert.ok(o.nextReference.startsWith('#FX-'));
    assert.equal(o.fixtureTypes.length, 10);
    assert.equal(o.zones.length, 6);
  }],

  ['fixture quick-create injects a new dropdown option', async () => {
    const r: any = await run(
      'mutation F($n: String!, $t: String!) { createMaintenanceFixture(name: $n, fixtureType: $t) }',
      {n: 'Bench #B-311', t: 'Bench'},
    );
    assert.equal(r.errors, undefined);
    assert.equal(r.data.createMaintenanceFixture, 'Bench #B-311');
    const opts: any = await run(
      'query O($p: ID!) { maintenanceFormOptions(programId: $p) { fixtures } }', {p: 'p1'},
    );
    assert.equal(opts.data.maintenanceFormOptions.fixtures[0], 'Bench #B-311');
  }],

  ['dispatch list resolves with distinct ids and references', async () => {
    const r: any = await run(
      'query D($p: ID!) { dispatches(programId: $p) { id reference status priority typeOfActivity } }',
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    assert.equal(r.data.dispatches.length, 31);
    assert.equal(new Set(r.data.dispatches.map((d: any) => d.id)).size, 31);
    assert.equal(new Set(r.data.dispatches.map((d: any) => d.reference)).size, 31);
    // The id/reference seam: an opaque id is never the display reference.
    assert.ok(r.data.dispatches.every((d: any) => d.id !== d.reference));
    assert.ok(['OPEN', 'ESCALATED', 'CLOSED'].includes(r.data.dispatches[0].status));
    assert.ok(['LOW', 'MEDIUM', 'HIGH'].includes(r.data.dispatches[0].priority));
  }],

  ['dispatch detail resolves its nested escalations and incidents', async () => {
    const r: any = await run(
      `query D($id: ID!) { dispatch(id: $id) {
        reference createdBy tagSelected assignedIndividual initialOutcome outcomeNotes
        escalations { id label type respondingPerson timeCalled status notes }
        incidents {
          id reference label priority incidentType outcome zone businessName documentCount
          police { name timeCalled timeArrived }
          ems { name responder }
          parties { name }
          vehicles { year }
          connectedEquipment
        }
      } }`,
      {id: 'dp_0000_06'},
    );
    assert.equal(r.errors, undefined);
    const d = r.data.dispatch;
    assert.equal(d.reference, '#BBB-D 0000-06');
    assert.equal(d.tagSelected, 'Unsheltered');
    assert.equal(d.escalations.length, 1);
    assert.equal(d.escalations[0].label, 'EMS');
    assert.equal(d.incidents.length, 1);
    assert.equal(d.incidents[0].id, '1496371');
    assert.equal(d.incidents[0].reference, '#96211407');
    // The id/reference seam again, one level down: nested types get it wrong
    // more often than top-level ones, because nothing forces the distinction.
    assert.ok(d.incidents.every((i: any) => i.id !== i.reference));
    assert.equal(d.incidents[0].priority, 'HIGH');
    assert.equal(d.incidents[0].police.name, 'Jack Son');
    assert.equal(d.incidents[0].ems.name, null);
    assert.deepEqual(d.incidents[0].parties, []);
    assert.deepEqual(d.incidents[0].connectedEquipment, ['Equipment #4340']);
  }],

  ['an unknown dispatch id resolves to null rather than throwing', async () => {
    const r: any = await run(
      'query D($id: ID!) { dispatch(id: $id) { reference } }',
      {id: 'dp_nope'},
    );
    assert.equal(r.errors, undefined);
    assert.equal(r.data.dispatch, null);
  }],

  ['a dispatch with no escalations and no incidents resolves and maps cleanly', async () => {
    const r: any = await run(
      'query D($id: ID!) { dispatch(id: $id) { reference escalations { id } incidents { id } } }',
      {id: 'dp_0000_07'},
    );
    assert.equal(r.errors, undefined);
    const d = r.data.dispatch;
    assert.equal(d.reference, '#BBB-D 0000-07');
    assert.deepEqual(d.escalations, []);
    assert.deepEqual(d.incidents, []);
  }],

  ['every dispatch date-range bucket is non-empty against the current clock', async () => {
    const r: any = await run(
      'query D($p: ID!) { dispatches(programId: $p) { createdAt } }',
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    const dates: string[] = r.data.dispatches.map((d: any) => d.createdAt);

    // 'custom' is excluded: with no dates picked it matches everything, so it
    // proves nothing about the seed.
    const buckets = DATE_RANGE_OPTIONS.map(o => o.value).filter(v => v !== 'custom');
    const counts = new Map(
      buckets.map(v => [v, dates.filter(d => matchesDateRange(d, v)).length]),
    );

    for (const [bucket, count] of counts) {
      assert.ok(count > 0, `date range bucket "${bucket}" is empty — the seed has gone stale`);
    }
    // Last 30 must reach strictly further back than Last 7, or the two chips
    // are indistinguishable and the seed is too tightly clustered.
    assert.ok(counts.get('last30')! > counts.get('last7')!);

    // Nothing may be seeded into the future against a live clock.
    const now = Date.now();
    assert.ok(dates.every(d => Date.parse(d) <= now));
  }],

  ['dispatch incident form options serve every dropdown', async () => {
    const r: any = await run(
      `query O($p: ID!) { dispatchIncidentFormOptions(programId: $p) {
        nextReference incidentTypes outcomes zones businessNames fixtures
        partyTypes maintenanceOptions poiOptions equipmentOptions
      } }`,
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    const o = r.data.dispatchIncidentFormOptions;
    assert.ok(o.nextReference.startsWith('#'));
    assert.equal(o.incidentTypes.length, 13);
    assert.equal(o.outcomes.length, 13);
    assert.equal(o.zones.length, 6);
    assert.equal(o.partyTypes.length, 6);
    for (const list of [o.businessNames, o.fixtures, o.maintenanceOptions, o.poiOptions, o.equipmentOptions]) {
      assert.ok(list.length > 0);
    }
    // The reference is reserved, not consumed by reading it — two reads with
    // no create in between must still agree on the same nextReference.
    const again: any = await run(
      'query O($p: ID!) { dispatchIncidentFormOptions(programId: $p) { nextReference } }',
      {p: 'p1'},
    );
    assert.equal(again.data.dispatchIncidentFormOptions.nextReference, o.nextReference);
  }],

  ['dispatch incident create round-trips onto its parent dispatch', async () => {
    const before: any = await run(
      'query O($p: ID!) { dispatchIncidentFormOptions(programId: $p) { nextReference } }',
      {p: 'p1'},
    );
    const reserved = before.data.dispatchIncidentFormOptions.nextReference;

    const created: any = await run(
      `mutation C($d: ID!, $i: DispatchIncidentInput!) {
        createDispatchIncident(dispatchId: $d, input: $i) { id reference label priority }
      }`,
      {
        d: 'dp_0000_09',
        i: {
          incidentType: 'Welfare Check',
          occurredAt: '2026-08-04T10:00:00',
          outcome: 'Referred to Outreach',
          priority: 'MEDIUM',
          address: '1601 Wewatta St, Denver, CO 80202',
          describeLocation: null,
          zone: 'Zone 2',
          businessName: null,
          notes: 'Added from dispatch review',
          documentCount: 0,
          reportStatus: 'In Progress',
          supervisorStatus: 'In Progress',
          police: null,
          fire: null,
          ems: null,
          clientName: null,
          parties: [],
          vehicles: [],
          fixture: null,
          connectedMaintenance: [],
          connectedPois: [],
          connectedEquipment: [],
        },
      },
    );
    assert.equal(created.errors, undefined);
    const inc = created.data.createDispatchIncident;
    assert.equal(inc.reference, reserved);
    assert.notEqual(inc.id, inc.reference);
    // First incident on this dispatch — the label counts within the dispatch.
    assert.equal(inc.label, 'Incident 1');
    // The nested-enum trap: priority must come back uppercased, like the
    // seeded incidents do, not as the display-shape 'Medium'.
    assert.equal(inc.priority, 'MEDIUM');

    const read: any = await run(
      'query D($id: ID!) { dispatch(id: $id) { incidents { id reference label priority } } }',
      {id: 'dp_0000_09'},
    );
    assert.equal(read.errors, undefined);
    assert.equal(read.data.dispatch.incidents.length, 1);
    assert.equal(read.data.dispatch.incidents[0].reference, reserved);
    assert.equal(read.data.dispatch.incidents[0].priority, 'MEDIUM');

    // The reserved reference is consumed, so the next open gets a fresh one.
    const after: any = await run(
      'query O($p: ID!) { dispatchIncidentFormOptions(programId: $p) { nextReference } }',
      {p: 'p1'},
    );
    assert.notEqual(after.data.dispatchIncidentFormOptions.nextReference, reserved);
  }],

  ['a dispatch incident created with every involvement answered No stores nulls', async () => {
    const created: any = await run(
      `mutation C($d: ID!, $i: DispatchIncidentInput!) {
        createDispatchIncident(dispatchId: $d, input: $i) {
          id
          police { name timeCalled timeArrived }
          fire { name }
          ems { name responder }
          clientName
          describeLocation
          businessName
        }
      }`,
      {
        d: 'dp_0000_14',
        i: {
          incidentType: 'Graffiti',
          occurredAt: '2026-08-04T11:00:00',
          outcome: 'Documented',
          priority: 'LOW',
          address: '1430 Larimer St, Denver, CO 80202',
          describeLocation: null,
          zone: 'Zone 1',
          businessName: null,
          notes: null,
          documentCount: 0,
          reportStatus: 'Open',
          supervisorStatus: 'In Progress',
          police: null,
          fire: null,
          ems: null,
          clientName: null,
          parties: [],
          vehicles: [],
          fixture: null,
          connectedMaintenance: [],
          connectedPois: [],
          connectedEquipment: [],
        },
      },
    );
    assert.equal(created.errors, undefined);
    const inc = created.data.createDispatchIncident;
    // A No answer must land as null, not '' — the read sheet renders null as
    // 'N/A' and an empty string as blank.
    assert.equal(inc.police.name, null);
    assert.equal(inc.police.timeCalled, null);
    assert.equal(inc.police.timeArrived, null);
    assert.equal(inc.fire.name, null);
    assert.equal(inc.ems.name, null);
    assert.equal(inc.ems.responder, null);
    assert.equal(inc.clientName, null);
    assert.equal(inc.describeLocation, null);
    assert.equal(inc.businessName, null);
  }],

  ['a second dispatch incident gets the next label within its own dispatch', async () => {
    const input = {
      incidentType: 'Trespassing',
      occurredAt: '2026-08-04T12:00:00',
      outcome: 'Warning Issued',
      priority: 'HIGH',
      address: '1601 Wewatta St, Denver, CO 80202',
      describeLocation: 'North entrance',
      zone: 'Zone 3',
      businessName: 'Union Station',
      notes: 'Second one',
      documentCount: 2,
      reportStatus: 'Open',
      supervisorStatus: 'In Progress',
      police: {name: 'Officer R. Vance', responder: null, timeCalled: '2026-08-04T11:50:00', timeArrived: '2026-08-04T11:58:00'},
      fire: null,
      ems: null,
      clientName: 'Jacob',
      parties: [{name: 'Jacob', type: 'Witness', organization: 'Jacob & Sons', streetAddress: null, phone: '+1 555-5555', email: 'jacob12@gmail.com'}],
      vehicles: [{year: '2021', make: 'Honda', model: 'Civic', color: 'Black', licenseNumber: 'SL139224'}],
      fixture: 'Bench #B-204',
      connectedMaintenance: ['Maintenance #96211'],
      connectedPois: [],
      connectedEquipment: ['Tool Box'],
    };
    // dp_0000_09 already has the incident created two checks above.
    const created: any = await run(
      `mutation C($d: ID!, $i: DispatchIncidentInput!) {
        createDispatchIncident(dispatchId: $d, input: $i) {
          label documentCount police { name timeCalled }
          parties { name type organization streetAddress }
          vehicles { make licenseNumber }
          fixture connectedMaintenance connectedEquipment
        }
      }`,
      {d: 'dp_0000_09', i: input},
    );
    assert.equal(created.errors, undefined);
    const inc = created.data.createDispatchIncident;
    assert.equal(inc.label, 'Incident 2');
    assert.equal(inc.documentCount, 2);
    assert.equal(inc.police.name, 'Officer R. Vance');
    assert.equal(inc.parties.length, 1);
    assert.equal(inc.parties[0].type, 'Witness');
    assert.equal(inc.parties[0].streetAddress, null);
    assert.equal(inc.vehicles[0].licenseNumber, 'SL139224');
    assert.equal(inc.fixture, 'Bench #B-204');
    assert.deepEqual(inc.connectedMaintenance, ['Maintenance #96211']);
    assert.deepEqual(inc.connectedEquipment, ['Tool Box']);
  }],

  ['work log entries resolve with uppercase YesNo enums', async () => {
    const r: any = await run(
      'query W($p: ID!) { workLogEntries(programId: $p) { id reference shiftTypeName fvmAccessibilityChecked } }',
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    assert.equal(r.data.workLogEntries.length, 18);
    assert.ok(['YES', 'NO'].includes(r.data.workLogEntries[0].fvmAccessibilityChecked));
    // One entry per shift type, 3 each — Cleaning is seeded first.
    assert.equal(r.data.workLogEntries[0].shiftTypeName, 'Cleaning');
  }],

  ['an unknown work log id resolves to null rather than throwing', async () => {
    const r: any = await run(
      'query W($id: ID!) { workLogEntry(id: $id) { reference } }',
      {id: 'wl_nope'},
    );
    assert.equal(r.errors, undefined);
    assert.equal(r.data.workLogEntry, null);
  }],

  ['work log form options serve every dropdown', async () => {
    const r: any = await run(
      'query O($p: ID!, $s: ID!) { workLogFormOptions(programId: $p, shiftTypeId: $s) { nextReference entryTypes zones businessNames } }',
      {p: 'p1', s: 'st1'},
    );
    assert.equal(r.errors, undefined);
    const o = r.data.workLogFormOptions;
    assert.equal(o.entryTypes.length, 16);
    assert.equal(o.zones.length, 6);
    assert.equal(o.businessNames.length, 4);
  }],

  ['work log create freezes the shift, then round-trips through update and delete', async () => {
    const input = {
      entryType: 'Litter Pickup', machineNo: '12345678',
      requestDateTime: '2026-08-01T09:00:00',
      fvmAccessibilityChecked: 'YES', bridgePlateSecured: 'YES',
      accessibleFareGateWorking: 'NO', automaticDoorWorking: 'YES', fvmNotWorking: 'NO',
      address: '123 Test St', shiftTypeId: 'st5', shiftTypeName: 'Outreach',
    };
    const created: any = await run(
      'mutation C($p: ID!, $i: WorkLogInput!) { createWorkLogEntry(programId: $p, input: $i) { id reference } }',
      {p: 'p1', i: input},
    );
    assert.equal(created.errors, undefined);
    const id = created.data.createWorkLogEntry.id;

    const detail: any = await run(
      'query D($id: ID!) { workLogEntry(id: $id) { shiftTypeId shiftTypeName entryType quantity } }',
      {id},
    );
    assert.equal(detail.data.workLogEntry.shiftTypeId, 'st5');
    assert.equal(detail.data.workLogEntry.shiftTypeName, 'Outreach');
    assert.equal(detail.data.workLogEntry.entryType, 'Litter Pickup');
    // Never sent — the resolver's own default.
    assert.equal(detail.data.workLogEntry.quantity, '01');

    // The update input deliberately carries a DIFFERENT shift than the one the
    // entry was created under, so this actually exercises the freeze — an
    // update input that repeated the same shift would pass even if the
    // resolver started (wrongly) applying shiftTypeId/shiftTypeName from it.
    const updated: any = await run(
      'mutation U($id: ID!, $i: WorkLogInput!) { updateWorkLogEntry(id: $id, input: $i) { reference } }',
      {id, i: {...input, shiftTypeId: 'st1', shiftTypeName: 'Cleaning', quantity: '03'}},
    );
    assert.equal(updated.errors, undefined);
    const afterUpdate: any = await run(
      'query D($id: ID!) { workLogEntry(id: $id) { quantity shiftTypeId shiftTypeName } }', {id},
    );
    assert.equal(afterUpdate.data.workLogEntry.quantity, '03');
    // Frozen at creation — unaffected by the update input's different shift.
    assert.equal(afterUpdate.data.workLogEntry.shiftTypeId, 'st5');
    assert.equal(afterUpdate.data.workLogEntry.shiftTypeName, 'Outreach');

    // The Work tab's own list computes its Activity items live from the same
    // store this mutation just edited — confirm the entry is actually visible
    // there, not just readable back through workLogEntry.
    const inWorkList: any = await run(
      'query W($p: ID!) { workItems(programId: $p) { id category quantity } }',
      {p: 'p1'},
    );
    const workItem = inWorkList.data.workItems.find((w: any) => w.id === id);
    assert.ok(workItem, 'created entry should appear in workItems');
    // category is a plain String on WorkItem, not an enum — unlike status/priority.
    assert.equal(workItem.category, 'Activity');
    assert.equal(workItem.quantity, '03');

    const deleted: any = await run(
      'mutation Del($id: ID!) { deleteWorkLogEntry(id: $id) }', {id},
    );
    assert.equal(deleted.data.deleteWorkLogEntry, id);

    const goneFromWorkList: any = await run(
      'query W($p: ID!) { workItems(programId: $p) { id } }', {p: 'p1'},
    );
    assert.ok(!goneFromWorkList.data.workItems.some((w: any) => w.id === id));
    const gone: any = await run(
      'query D($id: ID!) { workLogEntry(id: $id) { reference } }', {id},
    );
    assert.equal(gone.data.workLogEntry, null);
  }],

  ['a typo fails loudly', async () => {
    const r: any = await run('query Bad { me { enable_shift_entry } }');
    assert.ok(r.errors?.[0]?.message.includes('Cannot query field'));
  }],

  ['incidents list resolves and the id/reference seam holds', async () => {
    const r: any = await run(
      `query I($p: ID!) { incidents(programId: $p) {
        id reference type outcome priority status occurredAt assignee { name initials }
        person businessName zone address queuedOffline dispatchReference
      } }`,
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    const list = r.data.incidents;
    assert.equal(list.length, 15);
    assert.ok(list.every((i: any) => i.id !== i.reference));
    assert.ok(list.every((i: any) => i.reference.startsWith('#IN-')));
    const first = list.find((i: any) => i.reference === '#IN-42984');
    assert.equal(first.type, 'Vandalism');
    assert.equal(first.status, 'IN_PROGRESS');
    assert.equal(first.priority, 'HIGH');
    assert.equal(first.assignee.name, 'John Carter');
    assert.equal(first.dispatchReference, null);
    const unassigned = list.find((i: any) => i.reference === '#IN-42905');
    assert.equal(unassigned.assignee, null);
    assert.equal(unassigned.queuedOffline, true);
    // The two records absorbed from Dispatch's old mocks — present in the
    // standalone list too, unassigned, and tagged with the dispatch that
    // created them.
    const fromDispatch1 = list.find((i: any) => i.reference === '#IN-42986');
    assert.equal(fromDispatch1.dispatchReference, 'dp_0000_06');
    assert.equal(fromDispatch1.assignee, null);
    const fromDispatch2 = list.find((i: any) => i.reference === '#IN-42987');
    assert.equal(fromDispatch2.dispatchReference, 'dp_0000_11');
  }],

  ['incident detail resolves every section', async () => {
    const list: any = await run('query I($p: ID!) { incidents(programId: $p) { id reference } }', {p: 'p1'});
    const id = list.data.incidents.find((i: any) => i.reference === '#IN-42984').id;
    const r: any = await run(
      `query D($id: ID!) { incident(id: $id) {
        ambassador createdBy supervisorStatus lastModifiedBy lastModifiedAt
        describeLocation fixture description documents
        police { name timeCalled timeArrived } fire { name } ems { name responder } clientName
        parties { name type organization streetAddress phone email }
        vehicles { year make model color licenseNumber }
        connectedMaintenance connectedPois connectedEquipment comments { id }
      } }`,
      {id},
    );
    assert.equal(r.errors, undefined);
    const d = r.data.incident;
    assert.equal(d.ambassador, 'John Carter');
    assert.equal(d.supervisorStatus, 'In Progress');
    assert.equal(d.police.name, 'Jack Son');
    assert.equal(d.fire.name, null);
    assert.equal(d.parties.length, 1);
    assert.equal(d.parties[0].organization, 'Jacob & Sons');
    assert.equal(d.vehicles[0].licenseNumber, 'SL139224');
    assert.deepEqual(d.connectedPois, ['POI #96211407']);

    const sparse: any = await run('query I($p: ID!) { incidents(programId: $p) { id reference } }', {p: 'p1'});
    const sparseId = sparse.data.incidents.find((i: any) => i.reference === '#IN-42960').id;
    const r2: any = await run('query D($id: ID!) { incident(id: $id) { police { name } fixture parties { name } } }', {id: sparseId});
    assert.equal(r2.data.incident.police.name, null);
    assert.equal(r2.data.incident.fixture, null);
    assert.equal(r2.data.incident.parties.length, 0);
  }],

  ['incidentFormOptions serves every dropdown and reserves a fresh reference each read', async () => {
    const r: any = await run(
      `query O($p: ID!) { incidentFormOptions(programId: $p) {
        nextReference incidentTypes outcomes zones businessNames fixtures
        partyTypes maintenanceOptions poiOptions equipmentOptions
      } }`,
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    const o = r.data.incidentFormOptions;
    assert.equal(o.nextReference, '#IN-42988');
    assert.equal(o.incidentTypes.length, 13);
    assert.equal(o.outcomes.length, 13);
    assert.equal(o.zones.length, 6);
    assert.equal(o.partyTypes.length, 6);
    for (const list of [o.businessNames, o.fixtures, o.maintenanceOptions, o.poiOptions, o.equipmentOptions]) {
      assert.ok(list.length > 0);
    }
  }],

  ['every incident date-range bucket is non-empty against the current clock', async () => {
    // Mirrors the existing dispatch check ('every dispatch date-range bucket
    // is non-empty…') so the same stale-seed trap can't recur a third time —
    // required by the approved spec (Decisions: "Date Range filtering is
    // real, not the mockup's pass-through"; Verification section).
    const r: any = await run(
      'query I($p: ID!) { incidents(programId: $p) { occurredAt } }',
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    const dates: string[] = r.data.incidents.map((i: any) => i.occurredAt);

    // 'custom' is excluded: with no dates picked it matches everything, so it
    // proves nothing about the seed.
    const buckets = DATE_RANGE_OPTIONS.map(o => o.value).filter(v => v !== 'custom');
    const counts = new Map(
      buckets.map(v => [v, dates.filter(d => matchesDateRange(d, v)).length]),
    );

    for (const [bucket, count] of counts) {
      assert.ok(count > 0, `date range bucket "${bucket}" is empty — the seed has gone stale`);
    }
    // Last 30 must reach strictly further back than Last 7, or the two chips
    // are indistinguishable and the seed is too tightly clustered.
    assert.ok(counts.get('last30')! > counts.get('last7')!);

    // Nothing may be seeded into the future against a live clock.
    const now = Date.now();
    assert.ok(dates.every(d => Date.parse(d) <= now));
  }],
];

async function main() {
  let failed = 0;
  for (const [name, fn] of checks) {
    try {
      await fn();
      console.log(`  ok   ${name}`);
    } catch (error: any) {
      failed++;
      console.log(`  FAIL ${name}\n       ${error.message}`);
    }
  }
  console.log(`\n${checks.length - failed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main();
