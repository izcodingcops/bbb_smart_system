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

  ['dispatch detail resolves its nested incidents via a join, not a stored array', async () => {
    const r: any = await run(
      `query D($id: ID!) { dispatch(id: $id) {
        reference createdBy tagSelected assignedIndividual initialOutcome outcomeNotes
        escalations { id label type respondingPerson timeCalled status notes }
        incidents {
          id reference type outcome priority status businessName documents dispatchReference createdBy description
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
    assert.equal(d.incidents[0].reference, '#IN-42986');
    assert.equal(d.incidents[0].dispatchReference, 'dp_0000_06');
    // Full detail flows through the join, not just the list-card fields —
    // IncidentAccordion needs both of these.
    assert.equal(d.incidents[0].createdBy, 'test user 99');
    assert.equal(d.incidents[0].description, 'Again');
    // The id/reference seam again, one level down.
    assert.ok(d.incidents.every((i: any) => i.id !== i.reference));
    assert.equal(d.incidents[0].priority, 'HIGH');
    assert.equal(d.incidents[0].police.name, 'Jack Son');
    assert.equal(d.incidents[0].ems.name, null);
    assert.deepEqual(d.incidents[0].parties, []);
    assert.deepEqual(d.incidents[0].connectedEquipment, ['Equipment #4340']);

    // A second dispatch's incident is never mistaken for this one's.
    const other: any = await run('query D($id: ID!) { dispatch(id: $id) { incidents { reference } } }', {id: 'dp_0000_11'});
    assert.deepEqual(other.data.dispatch.incidents.map((i: any) => i.reference), ['#IN-42987']);
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

  ['incidentFormOptions previews the next reference idempotently, until an incident actually consumes it', async () => {
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

    const again: any = await run('query O($p: ID!) { incidentFormOptions(programId: $p) { nextReference } }', {p: 'p1'});
    assert.equal(again.data.incidentFormOptions.nextReference, o.nextReference);

    // Create → delete → preview again, with no intervening preview between
    // create and delete: the number createIncident allocated must never be
    // handed back out, proving allocation (not just observation of the live
    // store) is what protects against reuse.
    const created: any = await run(
      `mutation C($p: ID!, $i: IncidentInput!) { createIncident(programId: $p, input: $i) { id reference } }`,
      {
        p: 'p1',
        i: {
          incidentType: 'Graffiti', occurredAt: '2026-08-05T09:00:00', outcome: 'Documented', priority: 'LOW',
          address: '1430 Larimer St, Denver, CO 80202', describeLocation: null, zone: 'Zone 1', businessName: null,
          description: null, documents: [], reportStatus: 'Open', supervisorStatus: 'In Progress',
          police: null, fire: null, ems: null, clientName: null,
          parties: [], vehicles: [], fixture: null, connectedMaintenance: [], connectedPois: [], connectedEquipment: [],
        },
      },
    );
    assert.equal(created.errors, undefined);
    const createdRef = created.data.createIncident.reference;
    assert.equal(createdRef, again.data.incidentFormOptions.nextReference);

    const deleted: any = await run('mutation D($id: ID!) { deleteIncident(id: $id) }', {id: created.data.createIncident.id});
    assert.equal(deleted.data.deleteIncident, created.data.createIncident.id);

    const afterDelete: any = await run('query O($p: ID!) { incidentFormOptions(programId: $p) { nextReference } }', {p: 'p1'});
    assert.notEqual(afterDelete.data.incidentFormOptions.nextReference, createdRef);
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

  ['incident create round-trips, always unassigned, status derived from reportStatus', async () => {
    const before: any = await run('query O($p: ID!) { incidentFormOptions(programId: $p) { nextReference } }', {p: 'p1'});
    const reserved = before.data.incidentFormOptions.nextReference;

    const created: any = await run(
      `mutation C($p: ID!, $i: IncidentInput!) {
        createIncident(programId: $p, input: $i) {
          id reference status priority assignee { name } dispatchReference person
        }
      }`,
      {
        p: 'p1',
        i: {
          incidentType: 'Welfare Check', occurredAt: '2026-08-05T10:00:00', outcome: 'Referred to Outreach',
          priority: 'MEDIUM', address: '1601 Wewatta St, Denver, CO 80202', describeLocation: null,
          zone: 'Zone 2', businessName: null, description: 'Added from the Incident tab',
          documents: [], reportStatus: 'In Progress', supervisorStatus: 'In Progress',
          police: null, fire: null, ems: null, clientName: null,
          parties: [{name: 'Jane Doe', type: 'Witness', organization: null, streetAddress: null, phone: null, email: null}],
          vehicles: [], fixture: null, connectedMaintenance: [], connectedPois: [], connectedEquipment: [],
        },
      },
    );
    assert.equal(created.errors, undefined);
    const inc = created.data.createIncident;
    assert.equal(inc.reference, reserved);
    assert.notEqual(inc.id, inc.reference);
    assert.equal(inc.status, 'IN_PROGRESS');
    assert.equal(inc.priority, 'MEDIUM');
    assert.equal(inc.assignee, null);
    assert.equal(inc.dispatchReference, null);
    assert.equal(inc.person, 'Jane Doe');

    const after: any = await run('query O($p: ID!) { incidentFormOptions(programId: $p) { nextReference } }', {p: 'p1'});
    assert.notEqual(after.data.incidentFormOptions.nextReference, reserved);
  }],

  ['an incident created with every involvement answered No stores nulls, and a dispatchReference round-trips', async () => {
    const created: any = await run(
      `mutation C($p: ID!, $i: IncidentInput!, $d: ID) {
        createIncident(programId: $p, input: $i, dispatchReference: $d) {
          id dispatchReference person
          police { name timeCalled timeArrived } fire { name } ems { name responder } clientName describeLocation businessName
        }
      }`,
      {
        p: 'p1',
        d: 'dp_0000_09',
        i: {
          incidentType: 'Graffiti', occurredAt: '2026-08-05T11:00:00', outcome: 'Documented', priority: 'LOW',
          address: '1430 Larimer St, Denver, CO 80202', describeLocation: null, zone: 'Zone 1', businessName: null,
          description: null, documents: [], reportStatus: 'Open', supervisorStatus: 'In Progress',
          police: null, fire: null, ems: null, clientName: null,
          parties: [], vehicles: [], fixture: null, connectedMaintenance: [], connectedPois: [], connectedEquipment: [],
        },
      },
    );
    assert.equal(created.errors, undefined);
    const inc = created.data.createIncident;
    assert.equal(inc.dispatchReference, 'dp_0000_09');
    assert.equal(inc.person, 'None');
    assert.equal(inc.police.name, null);
    assert.equal(inc.fire.name, null);
    assert.equal(inc.ems.name, null);
    assert.equal(inc.clientName, null);
    assert.equal(inc.describeLocation, null);
    // businessName is String! (non-null) on Incident, unlike the fields above —
    // an unset value normalizes to '', not null.
    assert.equal(inc.businessName, '');
  }],

  ['incident update and delete round-trip', async () => {
    const list: any = await run('query I($p: ID!) { incidents(programId: $p) { id reference } }', {p: 'p1'});
    const target = list.data.incidents.find((i: any) => i.reference === '#IN-42788');

    const updated: any = await run(
      `mutation U($id: ID!, $i: IncidentInput!) { updateIncident(id: $id, input: $i) { outcome priority } }`,
      {
        id: target.id,
        i: {
          incidentType: 'Graffiti', occurredAt: '2026-08-05T09:00:00', outcome: 'Resolved', priority: 'HIGH',
          address: '1430 Larimer St, Denver, CO 80202', describeLocation: null, zone: 'Zone 1', businessName: null,
          description: null, documents: [], reportStatus: 'Completed', supervisorStatus: 'Completed',
          police: null, fire: null, ems: null, clientName: null,
          parties: [], vehicles: [], fixture: null, connectedMaintenance: [], connectedPois: [], connectedEquipment: [],
        },
      },
    );
    assert.equal(updated.errors, undefined);
    assert.equal(updated.data.updateIncident.outcome, 'Resolved');
    assert.equal(updated.data.updateIncident.priority, 'HIGH');

    const deleted: any = await run('mutation D($id: ID!) { deleteIncident(id: $id) }', {id: target.id});
    assert.equal(deleted.data.deleteIncident, target.id);
    const gone: any = await run('query D($id: ID!) { incident(id: $id) { id } }', {id: target.id});
    assert.equal(gone.data.incident, null);
  }],

  ['setIncidentStatus round-trips', async () => {
    const list: any = await run('query I($p: ID!) { incidents(programId: $p) { id reference status } }', {p: 'p1'});
    const target = list.data.incidents.find((i: any) => i.reference === '#IN-42905');
    assert.equal(target.status, 'OPEN');
    const r: any = await run(
      'mutation S($id: ID!, $s: IncidentStatus!) { setIncidentStatus(id: $id, status: $s) { status } }',
      {id: target.id, s: 'COMPLETED'},
    );
    assert.equal(r.errors, undefined);
    assert.equal(r.data.setIncidentStatus.status, 'COMPLETED');
  }],

  ['incident comments: add, edit and delete round-trip', async () => {
    const list: any = await run('query I($p: ID!) { incidents(programId: $p) { id reference } }', {p: 'p1'});
    const target = list.data.incidents.find((i: any) => i.reference === '#IN-42860');

    const added: any = await run(
      `mutation A($id: ID!, $t: String!) { addIncidentComment(incidentId: $id, text: $t) { id text edited images } }`,
      {id: target.id, t: 'Followed up with the business owner.'},
    );
    assert.equal(added.errors, undefined);
    const comment = added.data.addIncidentComment;
    assert.equal(comment.edited, false);
    assert.deepEqual(comment.images, []);

    const read: any = await run('query D($id: ID!) { incident(id: $id) { comments { id text } } }', {id: target.id});
    assert.equal(read.data.incident.comments.length, 1);
    assert.equal(read.data.incident.comments[0].id, comment.id);

    const updated: any = await run(
      `mutation U($id: ID!, $c: ID!, $t: String!) { updateIncidentComment(incidentId: $id, commentId: $c, text: $t) { text edited } }`,
      {id: target.id, c: comment.id, t: 'Followed up — resolved.'},
    );
    assert.equal(updated.data.updateIncidentComment.text, 'Followed up — resolved.');
    assert.equal(updated.data.updateIncidentComment.edited, true);

    const deleted: any = await run(
      'mutation D($id: ID!, $c: ID!) { deleteIncidentComment(incidentId: $id, commentId: $c) }',
      {id: target.id, c: comment.id},
    );
    assert.equal(deleted.data.deleteIncidentComment, comment.id);
    const goneRead: any = await run('query D($id: ID!) { incident(id: $id) { comments { id } } }', {id: target.id});
    assert.equal(goneRead.data.incident.comments.length, 0);
  }],

  ['creating and deleting a dispatch-linked incident updates the join, and only the join', async () => {
    // Spec Verification section: createIncident with a dispatchReference
    // shows up in that dispatch's join on the next read, and nowhere else.
    // Only checkable once the join exists (this task). Positioned last in
    // the file — it mutates shared state (creates one record, deletes
    // another), and every other check in this file asserts exact state
    // that must not shift out from under it.
    const created: any = await run(
      `mutation C($p: ID!, $i: IncidentInput!, $d: ID) {
        createIncident(programId: $p, input: $i, dispatchReference: $d) { id reference }
      }`,
      {
        p: 'p1',
        d: 'dp_0000_06',
        i: {
          incidentType: 'Trespassing', occurredAt: '2026-08-05T12:00:00', outcome: 'Warning Issued', priority: 'LOW',
          address: '16th St Mall, Denver, CO 80202', describeLocation: null, zone: 'Zone 4', businessName: null,
          description: null, documents: [], reportStatus: 'Open', supervisorStatus: 'In Progress',
          police: null, fire: null, ems: null, clientName: null,
          parties: [], vehicles: [], fixture: null, connectedMaintenance: [], connectedPois: [], connectedEquipment: [],
        },
      },
    );
    assert.equal(created.errors, undefined);
    const newRef = created.data.createIncident.reference;
    const joined: any = await run('query D($id: ID!) { dispatch(id: $id) { incidents { reference } } }', {id: 'dp_0000_06'});
    assert.ok(joined.data.dispatch.incidents.some((i: any) => i.reference === newRef));
    const otherStillClean: any = await run('query D($id: ID!) { dispatch(id: $id) { incidents { reference } } }', {id: 'dp_0000_11'});
    assert.ok(otherStillClean.data.dispatch.incidents.every((i: any) => i.reference !== newRef));

    // Spec Verification section: deleting a dispatch-linked incident removes
    // it from that dispatch's join on the next read.
    const beforeDelete: any = await run('query D($id: ID!) { dispatch(id: $id) { incidents { id reference } } }', {id: 'dp_0000_06'});
    const toDelete = beforeDelete.data.dispatch.incidents.find((i: any) => i.reference === '#IN-42986');
    await run('mutation D($id: ID!) { deleteIncident(id: $id) }', {id: toDelete.id});
    const afterDelete: any = await run('query D($id: ID!) { dispatch(id: $id) { incidents { reference } } }', {id: 'dp_0000_06'});
    assert.ok(afterDelete.data.dispatch.incidents.every((i: any) => i.reference !== '#IN-42986'));
  }],

  // ---- POI ----

  ['poi list resolves with uppercase disposition enums', async () => {
    const r: any = await run(
      'query P($p: ID!) { pois(programId: $p) { reference disposition interactionCount queuedOffline } }',
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    assert.equal(r.data.pois.length, 11);
    assert.ok(r.data.pois.every((p: any) => /^[A-Z_]+$/.test(p.disposition)));
    // The export's one queued record, kept so the badge is reachable cold.
    assert.equal(r.data.pois.filter((p: any) => p.queuedOffline).length, 1);
    // Derived from the timeline, so it can never be a stale denormalised copy.
    assert.ok(r.data.pois.every((p: any) => typeof p.interactionCount === 'number'));
  }],

  ['poi detail resolves every section', async () => {
    const r: any = await run(
      `query D($id: ID!) { poi(id: $id) {
        reference name personType disposition zone address interactionCount
        createdBy { name initials } queuedOffline lastModifiedAt
        firstSeenAt lastModifiedBy contact top1020 alias gender age race weight height
        physicalDescription situation describeLocation
        contacts { name email phone relationship notes }
        connectedIncidents connectedMaintenance connectedEquipment
        interactions { id reference interactionType occurredAt zone fixture businessLocation violation note documents }
        updates { id reference occurredAt zone description }
      } }`,
      {id: 'poi_rivera'},
    );
    assert.equal(r.errors, undefined);
    const d = r.data.poi;
    assert.equal(d.reference, '#POI-4021');
    assert.equal(d.top1020, true);
    assert.equal(d.contacts.length, 2);
    assert.equal(d.interactions.length, 4);
    assert.equal(d.interactionCount, 4);
    assert.equal(d.updates.length, 2);
    assert.equal(d.connectedIncidents.length, 2);
    assert.ok(d.describeLocation);
    // Newest first — the order the view renders without re-sorting.
    assert.equal(d.interactions[0].reference, '#INT-9006');
  }],

  ['poi on an unknown id returns null, not an error', async () => {
    const r: any = await run('query D($id: ID!) { poi(id: $id) { reference } }', {id: 'nope'});
    assert.equal(r.errors, undefined);
    assert.equal(r.data.poi, null);
  }],

  ['person create, update and delete round-trip through the store', async () => {
    const input = {
      name: 'Test Person', personType: 'Regular Visitor', disposition: 'HOUSED',
      occurredAt: '2026-08-07T09:00:00.000Z', contact: '(303) 555-0000', top1020: false,
      alias: null, gender: 'Unknown', age: '40', race: 'Unknown', weight: null, height: null,
      physicalDescription: null, situation: null,
      contacts: [{name: 'Case Worker', email: '', phone: '(303) 555-0001', relationship: 'Case Worker', notes: ''}],
      connectedIncidents: [], connectedMaintenance: [], connectedEquipment: [],
    };
    const created: any = await run(
      'mutation C($p: ID!, $i: PoiInput!) { createPoi(programId: $p, input: $i) { id reference disposition address zone describeLocation interactionCount contacts { name } } }',
      {p: 'p1', i: input},
    );
    assert.equal(created.errors, undefined);
    const c = created.data.createPoi;
    assert.ok(c.reference.startsWith('#POI-'));
    assert.equal(c.disposition, 'HOUSED');
    assert.equal(c.interactionCount, 0);
    // Location is stamped server-side; the form has no Location section, so
    // describeLocation is the one part of it that stays null.
    assert.ok(c.address.length > 0);
    assert.ok(c.zone.length > 0);
    assert.equal(c.describeLocation, null);
    assert.equal(c.contacts.length, 1);

    const updated: any = await run(
      'mutation U($id: ID!, $i: PoiInput!) { updatePoi(id: $id, input: $i) { name disposition address zone } }',
      {id: c.id, i: {...input, name: 'Renamed Person', disposition: 'ACTIVE'}},
    );
    assert.equal(updated.errors, undefined);
    assert.equal(updated.data.updatePoi.name, 'Renamed Person');
    assert.equal(updated.data.updatePoi.disposition, 'ACTIVE');
    // address/zone aren't in PoiInput — an edit must not clear them.
    assert.equal(updated.data.updatePoi.address, c.address);
    assert.equal(updated.data.updatePoi.zone, c.zone);

    await run('mutation D($id: ID!) { deletePoi(id: $id) }', {id: c.id});
    const gone: any = await run('query D($id: ID!) { poi(id: $id) { reference } }', {id: c.id});
    assert.equal(gone.data.poi, null);
  }],

  ['addPoiInteraction appends to the timeline and increments interactionCount', async () => {
    const READ = 'query D($id: ID!) { poi(id: $id) { interactionCount interactions { id reference } } }';
    const before: any = await run(READ, {id: 'poi_rivera'});
    const count = before.data.poi.interactionCount;
    const added: any = await run(
      'mutation A($id: ID!, $i: PoiInteractionInput!) { addPoiInteraction(personId: $id, input: $i) { id reference } }',
      {id: 'poi_rivera', i: {
        interactionType: 'Observation', occurredAt: '2026-08-07T10:00:00.000Z', zone: 'Zone 2',
        fixture: null, businessLocation: null, violation: null, note: 'Smoke check.', documents: [],
      }},
    );
    assert.equal(added.errors, undefined);
    assert.ok(added.data.addPoiInteraction.reference.startsWith('#INT-'));
    const after: any = await run(READ, {id: 'poi_rivera'});
    assert.equal(after.data.poi.interactionCount, count + 1);
    assert.equal(after.data.poi.interactions.length, count + 1);
    // Newest first.
    assert.equal(after.data.poi.interactions[0].id, added.data.addPoiInteraction.id);
  }],

  ['addPoiUpdate appends to the timeline and leaves interactionCount unchanged', async () => {
    const READ = 'query D($id: ID!) { poi(id: $id) { interactionCount updates { id reference } } }';
    const before: any = await run(READ, {id: 'poi_rivera'});
    const count = before.data.poi.interactionCount;
    const updates = before.data.poi.updates.length;
    const added: any = await run(
      'mutation A($id: ID!, $i: PoiUpdateInput!) { addPoiUpdate(personId: $id, input: $i) { id reference } }',
      {id: 'poi_rivera', i: {occurredAt: '2026-08-07T11:00:00.000Z', zone: 'Zone 2', description: 'Smoke check.'}},
    );
    assert.equal(added.errors, undefined);
    assert.ok(added.data.addPoiUpdate.reference.startsWith('#UPD-'));
    const after: any = await run(READ, {id: 'poi_rivera'});
    assert.equal(after.data.poi.updates.length, updates + 1);
    assert.equal(after.data.poi.updates[0].id, added.data.addPoiUpdate.id);
    // An update is not an interaction.
    assert.equal(after.data.poi.interactionCount, count);
  }],

  ['deleting a person removes its interactions and updates with it', async () => {
    const created: any = await run(
      'mutation C($p: ID!, $i: PoiInput!) { createPoi(programId: $p, input: $i) { id } }',
      {p: 'p1', i: {
        name: 'Doomed Person', personType: 'Other', disposition: 'ACTIVE',
        occurredAt: '2026-08-07T09:00:00.000Z', contact: null, top1020: false,
        alias: null, gender: null, age: null, race: null, weight: null, height: null,
        physicalDescription: null, situation: null, contacts: [],
        connectedIncidents: [], connectedMaintenance: [], connectedEquipment: [],
      }},
    );
    const id = created.data.createPoi.id;
    await run(
      'mutation A($id: ID!, $i: PoiInteractionInput!) { addPoiInteraction(personId: $id, input: $i) { id } }',
      {id, i: {interactionType: 'Observation', occurredAt: '2026-08-07T10:00:00.000Z', zone: 'Zone 1',
        fixture: null, businessLocation: null, violation: null, note: null, documents: []}},
    );
    await run(
      'mutation A($id: ID!, $i: PoiUpdateInput!) { addPoiUpdate(personId: $id, input: $i) { id } }',
      {id, i: {occurredAt: '2026-08-07T11:00:00.000Z', zone: 'Zone 1', description: 'Doomed.'}},
    );
    const before: any = await run('query D($id: ID!) { poi(id: $id) { interactions { id } updates { id } } }', {id});
    assert.equal(before.data.poi.interactions.length, 1);
    assert.equal(before.data.poi.updates.length, 1);

    await run('mutation D($id: ID!) { deletePoi(id: $id) }', {id});
    // The timelines have no query of their own, so their removal is proven by
    // the record's — which is what the confirm dialog promises.
    const gone: any = await run('query D($id: ID!) { poi(id: $id) { reference } }', {id});
    assert.equal(gone.data.poi, null);
    const addingToGhost: any = await run(
      'mutation A($id: ID!, $i: PoiUpdateInput!) { addPoiUpdate(personId: $id, input: $i) { id } }',
      {id, i: {occurredAt: '2026-08-07T12:00:00.000Z', zone: 'Zone 1', description: 'Nope.'}},
    );
    assert.ok(addingToGhost.errors);
  }],

  ['the three POI form-options queries resolve and people are id/name pairs', async () => {
    const r: any = await run(
      `query O($p: ID!) {
        poiFormOptions(programId: $p) { nextReference personTypes dispositions genders races incidentOptions maintenanceOptions equipmentOptions }
        poiInteractionFormOptions(programId: $p) { nextReference people { id name } interactionTypes violations zones fixtures businessLocations }
        poiUpdateFormOptions(programId: $p) { nextReference people { id name } zones }
      }`,
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    const o = r.data.poiFormOptions;
    assert.ok(o.nextReference.startsWith('#POI-'));
    assert.equal(o.personTypes.length, 10);
    assert.equal(o.dispositions.length, 6);
    assert.equal(o.genders.length, 3);
    assert.equal(o.races.length, 8);
    const i = r.data.poiInteractionFormOptions;
    assert.ok(i.nextReference.startsWith('#INT-'));
    assert.equal(i.interactionTypes.length, 9);
    assert.equal(i.violations.length, 7);
    // A name is not a key: the picker sends the id, so the two must differ.
    assert.ok(i.people.length > 0);
    assert.ok(i.people[0].id.length > 0);
    assert.notEqual(i.people[0].id, i.people[0].name);
    const u = r.data.poiUpdateFormOptions;
    assert.ok(u.nextReference.startsWith('#UPD-'));
    assert.equal(u.zones.length, 6);
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
