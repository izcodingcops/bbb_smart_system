import assert from 'node:assert/strict';
import {graphql} from 'graphql';
import {mockSchema} from '../src/graphql/mockSchema';
import {DATE_RANGE_OPTIONS, matchesDateRange} from '../src/utils/dateRange';
import {RVP_SECTIONS, RVP_TOTAL_QUESTIONS} from '../src/mocks/rvpSiteVisit';

type Check = [name: string, run: () => Promise<void> | void];

const run = (source: string, variableValues?: Record<string, unknown>, token: string | null = null) =>
  graphql({schema: mockSchema, source, variableValues, contextValue: {token}});

const LOGIN = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      __typename
      ... on AuthSession { token user { id enableShiftEntry role programs { id } } shiftTypes { id } }
      ... on InvalidCredentials { message }
    }
  }
`;

const NOTIFICATIONS = `
  query N($p: ID!) {
    notifications(programId: $p) {
      id module title message icon createdAt unread
      related { recordType recordId reference title }
    }
  }
`;

const EQUIPMENT_DETAIL_SHAPE = `
  id reference serial name equipmentType category make model zone
  program region division
  status createdAt acquiredAt unit beginningUsage year ownership
  description checkedOutBy checkedOutAt mine queuedOffline
  fuel images incidents personsOfInterest maintenance
  upkeeps { id }
`;

const RVP_LIST = `
  query R($p: ID!) {
    rvpSiteVisits(programId: $p) {
      id reference program operationManager leaderPosition
      startDate endDate reviewedBy updatedBy updatedAt
      score scoreMax avgScore isComplete
    }
  }
`;

const RVP_DETAIL = `
  query D($id: ID!) {
    rvpSiteVisit(id: $id) {
      id reference visitType reasonForVisit images
      reviewedBy updatedBy leaderPosition
      score scoreMax avgScore isComplete
      sections {
        key title subtitle score scoreMax
        texts { label value }
        groups {
          title observedFrom observedTo howObserved notesLabel notes
          answers { question answer note images }
        }
      }
    }
  }
`;

const RVP_FORM_OPTIONS = `
  query O($p: ID!) {
    rvpSiteVisitFormOptions(programId: $p) {
      nextReference programs visitTypes operationManagers
      sections {
        key title subtitle textPrompts
        groups { key title requiresTime requiresHow notesLabel questions { key prompt } }
      }
    }
  }
`;

const RVP_CREATE = `
  mutation C($p: ID!, $input: RvpSiteVisitInput!) {
    createRvpSiteVisit(programId: $p, input: $input) {
      id reference score scoreMax avgScore isComplete
      visitType reasonForVisit leaderPosition reviewedBy updatedBy
      sections { key score scoreMax groups { title notes howObserved answers { question answer note } } }
    }
  }
`;

const RVP_UPDATE = `
  mutation U($id: ID!, $input: RvpSiteVisitInput!) {
    updateRvpSiteVisit(id: $id, input: $input) {
      id reference score scoreMax avgScore isComplete reviewedBy updatedBy updatedAt
    }
  }
`;

/** Answers the first `yes` questions YES and the next `no` questions NO. */
function rvpAnswers(yes: number, no: number) {
  const flat = RVP_SECTIONS.flatMap(s =>
    s.groups.flatMap(g => g.questions.map(q => ({sectionKey: s.key, groupKey: g.key, key: q.key}))),
  );
  const picked = flat.slice(0, yes + no).map((q, i) => ({...q, answer: i < yes ? 'YES' : 'NO'}));
  return RVP_SECTIONS.map(section => ({
    key: section.key,
    texts: section.textPrompts.map(() => ''),
    groups: section.groups.map(group => ({
      key: group.key,
      observedFrom: group.requiresTime ? '2026-08-17T08:15:00' : '',
      observedTo: group.requiresTime ? '2026-08-17T11:40:00' : '',
      howObserved: group.requiresHow ? 'Walked the district.' : '',
      notes: group.notesLabel ? 'Group note.' : '',
      answers: picked
        .filter(q => q.groupKey === group.key)
        .map(q => ({key: q.key, answer: q.answer, note: 'note text', images: []})),
    })),
  }));
}

const RVP_INPUT_BASE = {
  program: 'Louisville KY Training BID 1000',
  visitType: 'FULL_SITE_VISIT',
  operationManager: 'Michael Chou',
  startDate: '2026-08-17T00:00:00',
  endDate: '2026-08-17T00:00:00',
  images: [],
};

const EQUIPMENT_INPUT = {
  serial: 'SN-SMOKE-01',
  name: 'Smoke Test Van',
  acquiredAt: '2026-08-01T09:00:00',
  category: 'Vehicle',
  equipmentType: 'Van',
  make: 'Ford',
  model: 'Transit 250',
  unit: 'MILES',
  ownership: 'LEASED',
  fuel: 'Gas',
  year: '2024',
  beginningUsage: '1,200',
  zone: 'Zone 3',
  description: 'Created by the smoke script.',
  images: [],
  incidents: ['Graffiti — 07/04/2026'],
  personsOfInterest: [],
  maintenance: [],
};

/**
 * Shared by the create → update → delete checks below, which run in order
 * against the same in-memory store and hand the record along between them.
 */
let smokeEquipmentId = '';

const checks: Check[] = [
  ['schema builds', () => {
    assert.ok(mockSchema.getQueryType());
    assert.ok(mockSchema.getMutationType());
  }],

  ['login rejects a bad password as a union member, not an error', async () => {
    const r: any = await run(LOGIN, {input: {username: 'batman', password: 'wrong', loginType: 1}});
    assert.equal(r.errors, undefined);
    assert.equal(r.data.login.__typename, 'InvalidCredentials');
  }],

  ['login returns a session with programs and shift types', async () => {
    const r: any = await run(LOGIN, {input: {username: 'batman', password: 'Temp@123', loginType: 1}});
    assert.equal(r.errors, undefined);
    assert.equal(r.data.login.__typename, 'AuthSession');
    assert.equal(r.data.login.user.enableShiftEntry, true);
    assert.ok(r.data.login.user.programs.length > 0);
    assert.ok(r.data.login.shiftTypes.length > 0);
  }],

  ['login carries the user role, ambassador and supervisor alike', async () => {
    const amb: any = await run(LOGIN, {input: {username: 'batman', password: 'Temp@123', loginType: 1}});
    assert.equal(amb.data.login.user.role, 'AMBASSADOR');
    const sup: any = await run(LOGIN, {input: {username: 'taz', password: 'Temp@123', loginType: 1}});
    assert.equal(sup.data.login.user.role, 'SUPERVISOR');
  }],

  ['me resolves from the bearer token', async () => {
    const login: any = await run(LOGIN, {input: {username: 'batman', password: 'Temp@123', loginType: 1}});
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

  ['myEquipment returns only the signed-in user\'s custody', async () => {
    const r: any = await run(
      'query M($p: ID!) { myEquipment(programId: $p) { id mine status checkedOutBy checkedOutAt } }',
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    assert.equal(r.data.myEquipment.length, 5);
    assert.ok(r.data.myEquipment.every((e: any) => e.mine === true));
    assert.ok(r.data.myEquipment.every((e: any) => e.status === 'CHECKED_OUT'));
    assert.ok(
      r.data.myEquipment.every((e: any) => !Number.isNaN(Date.parse(e.checkedOutAt))),
      'checkedOutAt must parse as a date',
    );
    // A checked-out record must always name its holder; null here means the
    // check-out path left the record in a half-written state.
    assert.ok(r.data.myEquipment.every((e: any) => e.checkedOutBy));
  }],

  ['equipment resolves the merged pool with uppercase enums', async () => {
    const r: any = await run(
      `query E($p: ID!) {
        equipment(programId: $p) {
          id reference serial name equipmentType category make model zone
          program region division status createdAt unit ownership
          checkedOutBy checkedOutAt mine queuedOffline
        }
      }`,
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    const list = r.data.equipment;
    assert.equal(list.length, 25);
    assert.ok(list.every((e: any) => ['ACTIVE', 'CHECKED_OUT'].includes(e.status)));
    assert.ok(list.every((e: any) => ['MILES', 'HOURS', 'KILOMETERS', 'NONE'].includes(e.unit)));
    assert.ok(list.every((e: any) => ['OWNED', 'LEASED', 'RENTED', 'LOANED'].includes(e.ownership)));
    // id, reference and serial are three different strings on every record.
    assert.ok(list.every((e: any) => e.id !== e.reference && e.reference !== e.serial && e.id !== e.serial));
    assert.equal(list.filter((e: any) => e.mine).length, 5);
    assert.equal(list.filter((e: any) => e.status === 'CHECKED_OUT').length, 7);
    // Active records carry no holder; checked-out records always do.
    assert.ok(list.every((e: any) => (e.status === 'ACTIVE') === (e.checkedOutBy === null)));
  }],

  ['every equipment Date Range bucket is non-empty against the current clock', async () => {
    const r: any = await run('query E($p: ID!) { equipment(programId: $p) { createdAt } }', {p: 'p1'});
    const dates: string[] = r.data.equipment.map((e: any) => e.createdAt);
    for (const option of DATE_RANGE_OPTIONS) {
      if (option.value === 'custom') {
        continue;
      }
      assert.ok(
        dates.some(d => matchesDateRange(d, option.value)),
        `${option.label} is empty`,
      );
    }
  }],

  ['equipmentDetail resolves every section, and an unknown id resolves null', async () => {
    const r: any = await run(
      `query D($id: ID!) {
        equipmentDetail(id: $id) {
          id reference serial fuel images upkeeps { id upkeepType occurredAt vendor cost currentUsage zone description }
          incidents personsOfInterest maintenance
        }
      }`,
      {id: 'eq_4352'},
    );
    assert.equal(r.errors, undefined);
    const d = r.data.equipmentDetail;
    assert.equal(d.reference, '#4352');
    assert.equal(d.serial, 'werrtyui');
    assert.equal(d.upkeeps.length, 2);
    // Newest first — the detail's Upkeep tab renders them in array order.
    assert.equal(d.upkeeps[0].upkeepType, 'Body Work');
    assert.deepEqual(d.maintenance, ['#MT-4460 — Light Out']);
    // Nullable-in-SDL list fields still come back as arrays, never null.
    assert.ok(Array.isArray(d.images) && Array.isArray(d.personsOfInterest));

    const bare: any = await run(
      'query D($id: ID!) { equipmentDetail(id: $id) { id upkeeps { id } images } }',
      {id: 'eq_4331'},
    );
    assert.deepEqual(bare.data.equipmentDetail.upkeeps, []);
    assert.deepEqual(bare.data.equipmentDetail.images, []);

    const missing: any = await run(
      'query D($id: ID!) { equipmentDetail(id: $id) { id } }',
      {id: 'nope'},
    );
    assert.equal(missing.errors, undefined);
    assert.equal(missing.data.equipmentDetail, null);
  }],

  ['equipmentByCode matches on serial or reference, with or without the hash', async () => {
    const q = 'query C($p: ID!, $c: String!) { equipmentByCode(programId: $p, code: $c) { id serial reference } }';
    const bySerial: any = await run(q, {p: 'p1', c: 'SN-4341-BX'});
    assert.equal(bySerial.data.equipmentByCode.id, 'eq_4341');
    const lower: any = await run(q, {p: 'p1', c: 'sn-4341-bx'});
    assert.equal(lower.data.equipmentByCode.id, 'eq_4341');
    const byRef: any = await run(q, {p: 'p1', c: '#4341'});
    assert.equal(byRef.data.equipmentByCode.id, 'eq_4341');
    const bare: any = await run(q, {p: 'p1', c: '4341'});
    assert.equal(bare.data.equipmentByCode.id, 'eq_4341');
    const missing: any = await run(q, {p: 'p1', c: '9021'});
    assert.equal(missing.errors, undefined);
    assert.equal(missing.data.equipmentByCode, null);
  }],

  ['equipment form options resolve', async () => {
    const r: any = await run(
      'query O { equipmentFormOptions { upkeepTypes abnormalities zones } }',
    );
    assert.equal(r.errors, undefined);
    const o = r.data.equipmentFormOptions;
    assert.equal(o.upkeepTypes.length, 10);
    assert.ok(o.upkeepTypes.includes('Oil Change'));
    // The hub mockup's own list is test data ('12 Dec', '16 Jan Test Pre');
    // the create flow's list is the real one.
    assert.ok(!o.upkeepTypes.some((t: string) => t === '12 Dec'));
    assert.equal(o.abnormalities.length, 7);
    assert.ok(o.zones.length > 0);
  }],

  ['checkOutEquipment takes custody and checkInEquipment releases it', async () => {
    const q = 'query D($id: ID!) { equipmentDetail(id: $id) { id status mine checkedOutBy checkedOutAt } }';
    const before: any = await run(q, {id: 'eq_4341'});
    assert.equal(before.data.equipmentDetail.status, 'ACTIVE');
    assert.equal(before.data.equipmentDetail.mine, false);
    assert.equal(before.data.equipmentDetail.checkedOutBy, null);

    const out: any = await run(
      `mutation C($input: CheckOutEquipmentInput!) {
        checkOutEquipment(input: $input) { id reference status mine checkedOutBy checkedOutAt }
      }`,
      {input: {id: 'eq_4341', occurredAt: '2026-08-13T09:00:00', hasAbnormality: false, abnormality: null, description: '', images: []}},
    );
    assert.equal(out.errors, undefined);
    assert.equal(out.data.checkOutEquipment.status, 'CHECKED_OUT');
    assert.equal(out.data.checkOutEquipment.mine, true);
    assert.equal(out.data.checkOutEquipment.checkedOutBy, 'You');
    assert.equal(out.data.checkOutEquipment.checkedOutAt, '2026-08-13T09:00:00');
    assert.equal(out.data.checkOutEquipment.reference, '#4341');

    // It now shows up on the custody list.
    const mine: any = await run('query M($p: ID!) { myEquipment(programId: $p) { id } }', {p: 'p1'});
    assert.ok(mine.data.myEquipment.some((e: any) => e.id === 'eq_4341'));

    const back: any = await run(
      `mutation I($input: CheckInEquipmentInput!) {
        checkInEquipment(input: $input) { id status mine checkedOutBy checkedOutAt }
      }`,
      {input: {id: 'eq_4341', occurredAt: '2026-08-13T17:00:00', currentUsage: '120', hasAbnormality: false, abnormality: null, description: '', images: []}},
    );
    assert.equal(back.errors, undefined);
    assert.equal(back.data.checkInEquipment.status, 'ACTIVE');
    assert.equal(back.data.checkInEquipment.mine, false);
    assert.equal(back.data.checkInEquipment.checkedOutBy, null);
    assert.equal(back.data.checkInEquipment.checkedOutAt, null);

    const after: any = await run('query M($p: ID!) { myEquipment(programId: $p) { id } }', {p: 'p1'});
    assert.ok(!after.data.myEquipment.some((e: any) => e.id === 'eq_4341'));
  }],

  ['addEquipmentUpkeep files newest-first against one record only', async () => {
    const m = `mutation U($input: AddEquipmentUpkeepInput!) {
      addEquipmentUpkeep(input: $input) { id upkeeps { id upkeepType vendor cost currentUsage zone description occurredAt } }
    }`;
    const r: any = await run(m, {
      input: {
        id: 'eq_4337', upkeepType: 'Battery Service', occurredAt: '2026-08-13T10:00:00',
        vendor: 'Denver Fleet Services', currentUsage: '9,140', cost: '$88.00',
        zone: 'Zone 2', description: 'Replaced the battery pack.', images: [],
      },
    });
    assert.equal(r.errors, undefined);
    const list = r.data.addEquipmentUpkeep.upkeeps;
    assert.equal(list.length, 1);
    assert.equal(list[0].upkeepType, 'Battery Service');
    assert.ok(list[0].id.length > 0);

    // Second entry lands on top, not appended.
    const again: any = await run(m, {
      input: {
        id: 'eq_4337', upkeepType: 'Inspection', occurredAt: '2026-08-13T14:00:00',
        vendor: 'Alkota', currentUsage: '9,150', cost: '$20.00',
        zone: null, description: '', images: [],
      },
    });
    assert.equal(again.data.addEquipmentUpkeep.upkeeps.length, 2);
    assert.equal(again.data.addEquipmentUpkeep.upkeeps[0].upkeepType, 'Inspection');
    assert.notEqual(
      again.data.addEquipmentUpkeep.upkeeps[0].id,
      again.data.addEquipmentUpkeep.upkeeps[1].id,
    );

    // The store's per-record arrays are independent — a sibling stays empty.
    const other: any = await run(
      'query D($id: ID!) { equipmentDetail(id: $id) { upkeeps { id } } }',
      {id: 'eq_4339'},
    );
    assert.deepEqual(other.data.equipmentDetail.upkeeps, []);
  }],

  ['custody mutations reject an unknown id', async () => {
    // Asserting on the message, not merely on `errors` being present: a
    // missing mutation also populates `errors`, so a bare truthiness check
    // would keep passing if the resolvers were unwired.
    const out: any = await run(
      'mutation C($input: CheckOutEquipmentInput!) { checkOutEquipment(input: $input) { id } }',
      {input: {id: 'nope', occurredAt: '2026-08-13T09:00:00', hasAbnormality: false, abnormality: null, description: '', images: []}},
    );
    assert.match(out.errors?.[0]?.message ?? '', /unknown equipment/i);

    const back: any = await run(
      'mutation I($input: CheckInEquipmentInput!) { checkInEquipment(input: $input) { id } }',
      {input: {id: 'nope', occurredAt: '2026-08-13T09:00:00', currentUsage: '1', hasAbnormality: false, abnormality: null, description: '', images: []}},
    );
    assert.match(back.errors?.[0]?.message ?? '', /unknown equipment/i);

    const up: any = await run(
      'mutation U($input: AddEquipmentUpkeepInput!) { addEquipmentUpkeep(input: $input) { id } }',
      {input: {id: 'nope', upkeepType: 'Inspection', occurredAt: '2026-08-13T09:00:00', vendor: 'V', currentUsage: '1', cost: '$1.00', zone: null, description: '', images: []}},
    );
    assert.match(up.errors?.[0]?.message ?? '', /unknown equipment/i);
  }],

  ['createEquipment adds an active, unheld record to the top of the pool', async () => {
    const before: any = await run(
      'query E($p: ID!) { equipment(programId: $p) { id reference } }',
      {p: 'p1'},
    );
    const seen = new Set(before.data.equipment.map((e: any) => e.reference));

    const r: any = await run(
      `mutation C($p: ID!, $i: EquipmentInput!) {
        createEquipment(programId: $p, input: $i) { ${EQUIPMENT_DETAIL_SHAPE} }
      }`,
      {p: 'p1', i: EQUIPMENT_INPUT},
    );
    assert.equal(r.errors, undefined);
    const created = r.data.createEquipment;
    smokeEquipmentId = created.id;

    // A fresh reference, not a reused one, and an id on the store's own
    // `eq_<n>` convention rather than a new prefix.
    assert.ok(!seen.has(created.reference));
    assert.match(created.reference, /^#\d+$/);
    assert.match(created.id, /^eq_\d+$/);

    // Custody state is the resolver's, not the form's.
    assert.equal(created.status, 'ACTIVE');
    assert.equal(created.mine, false);
    assert.equal(created.checkedOutBy, null);
    assert.equal(created.checkedOutAt, null);
    assert.equal(created.queuedOffline, false);
    assert.deepEqual(created.upkeeps, []);

    // Every input field lands, enums included.
    assert.equal(created.serial, 'SN-SMOKE-01');
    assert.equal(created.name, 'Smoke Test Van');
    assert.equal(created.acquiredAt, '2026-08-01T09:00:00');
    assert.equal(created.category, 'Vehicle');
    assert.equal(created.equipmentType, 'Van');
    assert.equal(created.make, 'Ford');
    assert.equal(created.model, 'Transit 250');
    assert.equal(created.unit, 'MILES');
    assert.equal(created.ownership, 'LEASED');
    assert.equal(created.fuel, 'Gas');
    assert.equal(created.year, '2024');
    assert.equal(created.beginningUsage, '1,200');
    assert.equal(created.zone, 'Zone 3');
    assert.deepEqual(created.incidents, ['Graffiti — 07/04/2026']);

    // The org triple is resolved by the gateway, never sent by the form.
    assert.ok(created.program.length > 0);
    assert.ok(created.region.length > 0);
    assert.ok(created.division.length > 0);

    const after: any = await run(
      'query E($p: ID!) { equipment(programId: $p) { id } }',
      {p: 'p1'},
    );
    assert.equal(after.data.equipment.length, before.data.equipment.length + 1);
    assert.equal(after.data.equipment[0].id, created.id);
  }],

  ['updateEquipment rewrites the form fields and leaves custody state alone', async () => {
    // Put the record into custody with an upkeep filed against it first —
    // those are exactly the fields an edit must not clobber.
    const out: any = await run(
      `mutation C($input: CheckOutEquipmentInput!) {
        checkOutEquipment(input: $input) { id status mine checkedOutBy }
      }`,
      {input: {id: smokeEquipmentId, occurredAt: '2026-08-14T08:00:00', hasAbnormality: false, abnormality: null, description: '', images: []}},
    );
    assert.equal(out.data.checkOutEquipment.status, 'CHECKED_OUT');
    await run(
      'mutation U($input: AddEquipmentUpkeepInput!) { addEquipmentUpkeep(input: $input) { id } }',
      {input: {id: smokeEquipmentId, upkeepType: 'Inspection', occurredAt: '2026-08-14T09:00:00', vendor: 'V', currentUsage: '1,300', cost: '$10.00', zone: null, description: '', images: []}},
    );

    const before: any = await run(
      `query D($id: ID!) { equipmentDetail(id: $id) { ${EQUIPMENT_DETAIL_SHAPE} } }`,
      {id: smokeEquipmentId},
    );
    const was = before.data.equipmentDetail;

    const r: any = await run(
      `mutation U($id: ID!, $i: EquipmentInput!) {
        updateEquipment(id: $id, input: $i) { ${EQUIPMENT_DETAIL_SHAPE} }
      }`,
      {
        id: smokeEquipmentId,
        i: {
          ...EQUIPMENT_INPUT,
          serial: 'SN-SMOKE-02',
          name: 'Smoke Test Van (edited)',
          category: 'Power Tool',
          equipmentType: 'Drill',
          make: 'DeWalt',
          model: 'DCD791',
          unit: 'HOURS',
          ownership: 'OWNED',
          fuel: null,
          year: null,
          beginningUsage: null,
          zone: null,
          description: null,
          incidents: [],
          maintenance: ['#MT-4460 — Light Out'],
        },
      },
    );
    assert.equal(r.errors, undefined);
    const now = r.data.updateEquipment;

    // The form's own fields change, nullables included.
    assert.equal(now.serial, 'SN-SMOKE-02');
    assert.equal(now.name, 'Smoke Test Van (edited)');
    assert.equal(now.category, 'Power Tool');
    assert.equal(now.equipmentType, 'Drill');
    assert.equal(now.make, 'DeWalt');
    assert.equal(now.model, 'DCD791');
    assert.equal(now.unit, 'HOURS');
    assert.equal(now.ownership, 'OWNED');
    assert.equal(now.fuel, null);
    assert.equal(now.year, null);
    assert.equal(now.beginningUsage, null);
    assert.equal(now.description, null);
    assert.deepEqual(now.incidents, []);
    assert.deepEqual(now.maintenance, ['#MT-4460 — Light Out']);

    // Everything the form does not own survives untouched. Clobbering `mine`
    // here would silently return a held record to the available pool.
    assert.equal(now.id, was.id);
    assert.equal(now.reference, was.reference);
    assert.equal(now.createdAt, was.createdAt);
    assert.equal(now.status, 'CHECKED_OUT');
    assert.equal(now.mine, true);
    assert.equal(now.checkedOutBy, 'You');
    assert.equal(now.checkedOutAt, was.checkedOutAt);
    assert.equal(now.queuedOffline, false);
    assert.equal(now.upkeeps.length, 1);

    const missing: any = await run(
      'mutation U($id: ID!, $i: EquipmentInput!) { updateEquipment(id: $id, input: $i) { id } }',
      {id: 'nope', i: EQUIPMENT_INPUT},
    );
    assert.match(missing.errors?.[0]?.message ?? '', /unknown equipment/i);
  }],

  ['deleteEquipment removes the record, and deleting it twice throws', async () => {
    const before: any = await run(
      'query E($p: ID!) { equipment(programId: $p) { id } }',
      {p: 'p1'},
    );

    const r: any = await run(
      'mutation D($id: ID!) { deleteEquipment(id: $id) }',
      {id: smokeEquipmentId},
    );
    assert.equal(r.errors, undefined);
    assert.equal(r.data.deleteEquipment, smokeEquipmentId);

    const after: any = await run(
      'query E($p: ID!) { equipment(programId: $p) { id } }',
      {p: 'p1'},
    );
    assert.equal(after.data.equipment.length, before.data.equipment.length - 1);
    assert.ok(!after.data.equipment.some((e: any) => e.id === smokeEquipmentId));

    const gone: any = await run(
      'query D($id: ID!) { equipmentDetail(id: $id) { id } }',
      {id: smokeEquipmentId},
    );
    assert.equal(gone.data.equipmentDetail, null);

    const twice: any = await run(
      'mutation D($id: ID!) { deleteEquipment(id: $id) }',
      {id: smokeEquipmentId},
    );
    assert.match(twice.errors?.[0]?.message ?? '', /unknown equipment/i);
  }],

  ['the form options taxonomy merges the store into the static mockup tree', async () => {
    const r: any = await run(`query O {
      equipmentFormOptions {
        nextReference
        categories { name types { name makes { name models } } }
        fuels incidents personsOfInterest maintenance
      }
    }`);
    assert.equal(r.errors, undefined);
    const o = r.data.equipmentFormOptions;

    assert.match(o.nextReference, /^#\d+$/);
    assert.deepEqual(o.fuels, ['Gas', 'Electricity']);
    assert.ok(o.incidents.length > 0);
    assert.ok(o.personsOfInterest.length > 0);
    assert.ok(o.maintenance.length > 0);

    // The static mockup tree is present…
    const vehicle = o.categories.find((c: any) => c.name === 'Vehicle');
    assert.ok(vehicle);
    assert.ok(vehicle.types.some((t: any) => t.name === 'Van'));

    // …and so is a category that exists only in the seeded store. Without the
    // merge, opening Edit on eq_4339 would show a Category the dropdown
    // cannot represent and blank its own type/make/model on first touch.
    const bicycle = o.categories.find((c: any) => c.name === 'Bicycle');
    assert.ok(bicycle, 'Bicycle is seeded in the store but absent from the taxonomy');
    const type = bicycle.types.find((t: any) => t.name === 'Info-Trike');
    assert.ok(type, 'the store record\'s own type is missing under Bicycle');
    const make = type.makes.find((m: any) => m.name === 'Trek');
    assert.ok(make, 'the store record\'s own make is missing under Info-Trike');
    // Exactly its own model: 'Trek' also sits under Vehicle → E-Bike with a
    // different model list, and the two branches must not bleed together.
    assert.deepEqual(make.models, ['ATLV']);

    // Alphabetical at every level, so merged entries interleave rather than
    // trailing the static ones.
    const names = o.categories.map((c: any) => c.name);
    assert.deepEqual(names, [...names].sort((a: string, b: string) => a.localeCompare(b)));

    // The 'Dewalt' / 'DeWalt' split in the mocks is normalised — one make.
    const powerTool = o.categories.find((c: any) => c.name === 'Power Tool');
    const drill = powerTool.types.find((t: any) => t.name === 'Drill');
    assert.ok(!drill.makes.some((m: any) => m.name === 'Dewalt'));
  }],

  ['the form options ownership and unit lists come back as wire enums', async () => {
    const r: any = await run(
      'query O { equipmentFormOptions { ownerships units } }',
    );
    assert.equal(r.errors, undefined);
    // Uppercasing happens in the resolver, nowhere else — hooks.ts maps these
    // back to the display union before the dropdowns ever see them.
    assert.deepEqual(r.data.equipmentFormOptions.ownerships, ['OWNED', 'LEASED', 'RENTED', 'LOANED']);
    assert.deepEqual(r.data.equipmentFormOptions.units, ['MILES', 'HOURS', 'KILOMETERS', 'NONE']);
  }],

  // The assignee kind is spelled in three places — the SDL enum, the resolver's
  // two translation maps, and the hooks layer. Only the first three are
  // reachable from here, and a missing entry fails at runtime rather than
  // compile time, so exercise every kind end to end.
  ['every MaintenanceAssigneeKind survives a create round-trip', async () => {
    const create = `mutation C($p: ID!, $i: MaintenanceRequestInput!) {
      createMaintenanceRequest(programId: $p, input: $i) {
        reference assigneeKind department routedToSupervisor
        assignee { name initials }
      }
    }`;
    const base = {
      type: 'Alley Cleaning',
      requestedAt: new Date().toISOString(),
      priority: 'LOW',
      address: '1 Test St',
    };

    const amb: any = await run(create, {
      p: 'p1',
      i: {...base, assigneeKind: 'AMBASSADOR', ambassador: 'Ava Nguyen'},
    });
    assert.equal(amb.errors, undefined);
    const a = amb.data.createMaintenanceRequest;
    assert.equal(a.assigneeKind, 'AMBASSADOR');
    // Field-by-field: graphql() returns null-prototype objects, which
    // deepEqual rejects against a plain literal even when the values match.
    assert.equal(a.assignee.name, 'Ava Nguyen');
    assert.equal(a.assignee.initials, 'AN');
    assert.equal(a.routedToSupervisor, false, 'a named assignee is not awaiting triage');

    const me: any = await run(create, {
      p: 'p1',
      i: {...base, assigneeKind: 'ME', ambassador: 'Jane Smith'},
    });
    assert.equal(me.errors, undefined);
    assert.equal(me.data.createMaintenanceRequest.assigneeKind, 'ME');
    assert.equal(me.data.createMaintenanceRequest.assignee.name, 'Jane Smith');
    assert.equal(me.data.createMaintenanceRequest.routedToSupervisor, false);

    const sup: any = await run(create, {
      p: 'p1',
      i: {...base, assigneeKind: 'SUPERVISOR'},
    });
    assert.equal(sup.errors, undefined);
    assert.equal(sup.data.createMaintenanceRequest.assignee, null);
    assert.equal(sup.data.createMaintenanceRequest.routedToSupervisor, true);

    const dept: any = await run(create, {
      p: 'p1',
      i: {...base, assigneeKind: 'DEPARTMENT', department: 'Facilities Team'},
    });
    assert.equal(dept.errors, undefined);
    assert.equal(dept.data.createMaintenanceRequest.department, 'Facilities Team');
    assert.equal(dept.data.createMaintenanceRequest.assignee, null);
    assert.equal(dept.data.createMaintenanceRequest.routedToSupervisor, false);
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
        assignee { name initials }
        programName programCode createdBy paid assigneeKind department
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
    // The detail screen's "Assigned To" reads these two, and the mock keeps
    // the kind in step with the assignee rather than recording how the record
    // originally arrived — see the invariant note in src/mocks/maintenance.ts.
    assert.equal(d.assigneeKind, 'AMBASSADOR');
    assert.equal(d.assignee.name, 'Marcus Bell');
    assert.equal(d.department, null);
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
      'query O($p: ID!) { maintenanceFormOptions(programId: $p) { nextReference types zones departments businessNames fixtures incidents pois equipment } }',
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    const o = r.data.maintenanceFormOptions;
    assert.ok(o.nextReference.startsWith('#MT-'));
    assert.equal(o.types.length, 10);
    assert.equal(o.zones.length, 6);
    // fixtures is served from fixtureStore titles alone — one source of truth.
    assert.ok(o.fixtures.includes('16th St Floor Fixture'));
    // equipment likewise comes from the Equipment module's records, not the
    // placeholder list this module used to keep ('Hammer', 'Tool Box', …).
    assert.ok(o.equipment.includes('Car 1700cc'));
    assert.ok(!o.equipment.includes('Hammer'));
    // Both option lists are deduped by name.
    assert.equal(new Set(o.equipment).size, o.equipment.length);
    assert.equal(new Set(o.pois).size, o.pois.length);
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

  // Connected Elements opens the Fixture module's own create form rather than a
  // maintenance-local quick-create, so the real mutation is what has to feed
  // the dropdown. (createMaintenanceFixture, which this test used to exercise,
  // no longer exists.)
  ['a fixture created through the real mutation appears in maintenance options', async () => {
    const r: any = await run(
      'mutation C($p: ID!, $i: FixtureInput!) { createFixture(programId: $p, input: $i) { reference } }',
      {
        p: 'p1',
        i: {
          title: 'Bench #B-311', serviceDateTime: '2026-08-16T09:00:00',
          fixtureType: 'Bench', status: 'ACTIVE', address: '16th St Mall',
          zone: 'Zone 2', describeLocation: null, description: null, documents: [],
        },
      },
    );
    assert.equal(r.errors, undefined);
    const opts: any = await run(
      'query O($p: ID!) { maintenanceFormOptions(programId: $p) { fixtures } }', {p: 'p1'},
    );
    // unshifted onto the store, so the newest fixture leads the option list —
    // this is the title the maintenance form selects on the way back.
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

  ['observation reports resolve with 40 records split evenly by type', async () => {
    const r: any = await run(
      'query R($p: ID!) { observationReports(programId: $p) { id reference type score checklist { question answer } } }',
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    const reports = r.data.observationReports;
    assert.equal(reports.length, 40);
    assert.equal(reports.filter((x: any) => x.type === 'AMBASSADOR').length, 20);
    assert.equal(reports.filter((x: any) => x.type === 'SUPERVISOR').length, 20);
    assert.ok(reports.every((x: any) => x.checklist.length === 5));
  }],

  ['observation report detail resolves, unknown id resolves null', async () => {
    const r: any = await run(
      'query D($id: ID!) { observationReport(id: $id) { reference zone summary checklist { question answer note } } }',
      {id: 'obr_2043'},
    );
    assert.equal(r.errors, undefined);
    assert.equal(r.data.observationReport.reference, '#OBR-2043');
    assert.equal(r.data.observationReport.zone, 'Downtown Louisville');
    assert.equal(r.data.observationReport.checklist[0].answer, 'Yes');

    const missing: any = await run(
      'query D($id: ID!) { observationReport(id: $id) { reference } }',
      {id: 'obr_does_not_exist'},
    );
    assert.equal(missing.data.observationReport, null);
  }],

  ['reference documents resolve with 30 records', async () => {
    const r: any = await run(
      'query R($p: ID!) { referenceDocuments(programId: $p) { id reference entryType fixtureType fixture } }',
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    const docs = r.data.referenceDocuments;
    assert.equal(docs.length, 30);
    // Nullable fixture fields resolve, not stringly '—' from the mockup.
    assert.ok(docs.some((d: any) => d.fixtureType === null));
  }],

  ['reference document detail resolves, unknown id resolves null', async () => {
    const r: any = await run(
      'query D($id: ID!) { referenceDocument(id: $id) { reference zone describe address } }',
      {id: 'refdoc_107799687'},
    );
    assert.equal(r.errors, undefined);
    assert.equal(r.data.referenceDocument.reference, '#107799687');
    assert.equal(r.data.referenceDocument.zone, 'Downtown Core');
    assert.equal(r.data.referenceDocument.address, '1701 Wynkoop St, Denver, CO 80202');

    const missing: any = await run(
      'query D($id: ID!) { referenceDocument(id: $id) { reference } }',
      {id: 'refdoc_does_not_exist'},
    );
    assert.equal(missing.data.referenceDocument, null);
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

  // Runs after every POI test that asserts a record count — it leaves the
  // person it creates in the store, the way the fixture quick-create does.
  ['person quick-create injects a new maintenance dropdown option', async () => {
    const before: any = await run(
      'query O($p: ID!) { maintenanceFormOptions(programId: $p) { pois } }',
      {p: 'p1'},
    );
    assert.equal(before.errors, undefined);
    // Served from the POI store, not a static list of its own: a seeded person
    // is offered, and the old hardcoded names are gone.
    assert.ok(before.data.maintenanceFormOptions.pois.includes('James Rivera'));
    assert.ok(!before.data.maintenanceFormOptions.pois.includes('R. Blake'));

    const created: any = await run(
      'mutation C($p: ID!, $i: PoiInput!) { createPoi(programId: $p, input: $i) { reference } }',
      {
        p: 'p1',
        i: {
          name: 'Quick Created Person', personType: 'Regular Visitor',
          disposition: 'ACTIVE', occurredAt: '2026-08-16T09:00:00.000Z',
          contact: '(303) 555-0199', top1020: false, alias: null, gender: null,
          age: null, race: null, weight: null, height: null,
          physicalDescription: null, situation: null, contacts: [],
          connectedIncidents: [], connectedMaintenance: [], connectedEquipment: [],
        },
      },
    );
    assert.equal(created.errors, undefined);

    const after: any = await run(
      'query O($p: ID!) { maintenanceFormOptions(programId: $p) { pois } }',
      {p: 'p1'},
    );
    // unshifted onto the store, so the newest person leads the option list —
    // this is the value AddPoiSheet hands back for the form to select.
    assert.equal(after.data.maintenanceFormOptions.pois[0], 'Quick Created Person');
  }],

  // ---- Notifications ----
  // Read state mutates the shared store, so the two mark-read checks run last.

  ['notifications resolve with uppercase module enums', async () => {
    const r: any = await run(NOTIFICATIONS, {p: 'p1'});
    assert.equal(r.errors, undefined);
    assert.equal(r.data.notifications.length, 12);
    assert.ok(r.data.notifications.every((n: any) => /^[A-Z_]+$/.test(n.module)));
    // Nullable in the SDL, so a null must survive as null rather than vanish.
    assert.ok(r.data.notifications.some((n: any) => n.icon === null));
    assert.ok(r.data.notifications.every((n: any) => n.icon === null || /^[A-Z]+$/.test(n.icon)));
  }],

  ['every related recordType is uppercase — the nested enum is not skipped', async () => {
    const r: any = await run(NOTIFICATIONS, {p: 'p1'});
    const linked = r.data.notifications.filter((n: any) => n.related);
    assert.equal(linked.length, 8);
    assert.ok(linked.every((n: any) => /^[A-Z_]+$/.test(n.related.recordType)));
    // WORK_LOG is the one pair a mechanical transform would mangle.
    assert.ok(linked.some((n: any) => n.related.recordType === 'WORK_LOG'));
  }],

  ['every deep link resolves through its own module\'s detail query', async () => {
    const r: any = await run(NOTIFICATIONS, {p: 'p1'});
    const DETAIL: Record<string, string> = {
      MAINTENANCE: 'query D($id: ID!) { record: maintenanceRequest(id: $id) { id reference } }',
      INCIDENT: 'query D($id: ID!) { record: incident(id: $id) { id reference } }',
      FIXTURE: 'query D($id: ID!) { record: fixture(id: $id) { id reference } }',
      POI: 'query D($id: ID!) { record: poi(id: $id) { id reference } }',
      WORK_LOG: 'query D($id: ID!) { record: workLogEntry(id: $id) { id reference } }',
    };
    for (const n of r.data.notifications) {
      if (!n.related) continue;
      const d: any = await run(DETAIL[n.related.recordType], {id: n.related.recordId});
      assert.equal(d.errors, undefined, `${n.id} → ${n.related.recordType}`);
      assert.ok(d.data.record, `${n.id} points at a missing record: ${n.related.recordId}`);
      // The reference in the copy is the reference of the record it opens.
      assert.equal(d.data.record.reference, n.related.reference);
      assert.ok(n.message.includes(n.related.reference));
    }
  }],

  ['the unlinked notifications are exactly the System and Equipment ones', async () => {
    const r: any = await run(NOTIFICATIONS, {p: 'p1'});
    const unlinked = r.data.notifications.filter((n: any) => !n.related);
    assert.equal(unlinked.length, 4);
    assert.deepEqual(
      unlinked.map((n: any) => n.module).sort(),
      ['EQUIPMENT', 'EQUIPMENT', 'SYSTEM', 'SYSTEM'],
    );
  }],

  ['every notification recency bucket is non-empty against the current clock', async () => {
    const r: any = await run(NOTIFICATIONS, {p: 'p1'});
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    // Calendar days between the record's day and today; `round` absorbs the
    // 23/25-hour days a DST boundary produces.
    const dayIndex = (iso: string) => {
      const d = new Date(iso);
      d.setHours(0, 0, 0, 0);
      return Math.round((startOfToday.getTime() - d.getTime()) / 86400000);
    };
    const days = r.data.notifications.map((n: any) => dayIndex(n.createdAt));
    assert.ok(days.some((d: number) => d === 0), 'Today is empty');
    assert.ok(days.some((d: number) => d === 1), 'Yesterday is empty');
    assert.ok(days.some((d: number) => d > 1 && d <= 7), 'Last 7 days is empty');
    // Nothing seeded into the future, whatever time of day this runs.
    assert.ok(days.every((d: number) => d >= 0));
  }],

  ['unreadNotificationCount agrees with the list', async () => {
    const r: any = await run(NOTIFICATIONS, {p: 'p1'});
    const c: any = await run('query C($p: ID!) { unreadNotificationCount(programId: $p) }', {p: 'p1'});
    assert.equal(c.errors, undefined);
    assert.equal(
      c.data.unreadNotificationCount,
      r.data.notifications.filter((n: any) => n.unread).length,
    );
    assert.ok(c.data.unreadNotificationCount > 0);
  }],

  ['markNotificationRead flips one record and decrements the count', async () => {
    const before: any = await run('query C($p: ID!) { unreadNotificationCount(programId: $p) }', {p: 'p1'});
    const m: any = await run('mutation M($id: ID!) { markNotificationRead(id: $id) { id unread } }', {id: 'ntf_1'});
    assert.equal(m.errors, undefined);
    assert.equal(m.data.markNotificationRead.unread, false);
    const after: any = await run('query C($p: ID!) { unreadNotificationCount(programId: $p) }', {p: 'p1'});
    assert.equal(after.data.unreadNotificationCount, before.data.unreadNotificationCount - 1);
    // Re-reading an already-read notification is a no-op, not a decrement.
    await run('mutation M($id: ID!) { markNotificationRead(id: $id) { id } }', {id: 'ntf_1'});
    const again: any = await run('query C($p: ID!) { unreadNotificationCount(programId: $p) }', {p: 'p1'});
    assert.equal(again.data.unreadNotificationCount, after.data.unreadNotificationCount);
  }],

  ['markAllNotificationsRead clears the count, and an unknown id throws', async () => {
    const m: any = await run('mutation M($p: ID!) { markAllNotificationsRead(programId: $p) { id unread } }', {p: 'p1'});
    assert.equal(m.errors, undefined);
    assert.ok(m.data.markAllNotificationsRead.every((n: any) => n.unread === false));
    const c: any = await run('query C($p: ID!) { unreadNotificationCount(programId: $p) }', {p: 'p1'});
    assert.equal(c.data.unreadNotificationCount, 0);
    const bad: any = await run('mutation M($id: ID!) { markNotificationRead(id: $id) { id } }', {id: 'ntf_nope'});
    assert.ok(bad.errors);
  }],
  ['rvpSiteVisits returns every seeded report, newest first', async () => {
    const r: any = await run(RVP_LIST, {p: 'p1'});
    assert.equal(r.errors, undefined);
    const rows = r.data.rvpSiteVisits;
    assert.equal(rows.length, 15);
    const updated = rows.map((v: any) => Date.parse(v.updatedAt));
    assert.deepEqual(updated, [...updated].sort((a: number, b: number) => b - a));
    // The three same-day reports lead the list. Which of them is first follows
    // updatedAt, the only timestamp a record carries — the handoff's own list
    // order comes from a separate `ts` field that disagrees with the clock
    // times printed on those same rows, so it is not reproducible here.
    assert.deepEqual(
      rows.slice(0, 3).map((v: any) => v.reference).sort(),
      ['#RVP-1186', '#RVP-1187', '#RVP-1188'],
    );
    // id and reference are distinct values, and neither is the other.
    const first = rows.find((v: any) => v.reference === '#RVP-1188');
    assert.equal(first.id, 'rvp_1188');
  }],

  ['every rvpSiteVisit avgScore is derived from score/scoreMax, not stored', async () => {
    const r: any = await run(RVP_LIST, {p: 'p1'});
    for (const v of r.data.rvpSiteVisits) {
      const expected = Math.round((v.score / v.scoreMax) * 5 * 10) / 10;
      assert.equal(v.avgScore, expected, `${v.reference} avgScore ${v.avgScore} != ${expected}`);
    }
    // The design's own stated averages, reproduced by the seeded Yes-counts.
    const byRef = new Map(r.data.rvpSiteVisits.map((v: any) => [v.reference, v.avgScore]));
    assert.equal(byRef.get('#RVP-1188'), 4.4);
    assert.equal(byRef.get('#RVP-1163'), 4.7);
    assert.equal(byRef.get('#RVP-1136'), 1.8);
  }],

  ['rvpSiteVisit scoreMax equals the served question tree, so they cannot drift', async () => {
    const fromTree = RVP_SECTIONS.reduce(
      (total, section) => total + section.groups.reduce((n, g) => n + g.questions.length, 0),
      0,
    );
    assert.equal(fromTree, 74);
    assert.equal(RVP_TOTAL_QUESTIONS, fromTree);
    const r: any = await run(RVP_LIST, {p: 'p1'});
    for (const v of r.data.rvpSiteVisits) {
      assert.equal(v.scoreMax, fromTree, `${v.reference} scoreMax ${v.scoreMax} != ${fromTree}`);
    }
  }],

  ['the seeded reports fill every score bucket, every date bucket, and both completion states', async () => {
    const r: any = await run(RVP_LIST, {p: 'p1'});
    const rows = r.data.rvpSiteVisits;

    // The overlapping-boundary buckets the list's Score filter uses.
    assert.ok(rows.some((v: any) => v.avgScore < 2), '0-2 Score is empty');
    assert.ok(rows.some((v: any) => v.avgScore >= 2 && v.avgScore < 3), '2-3 Score is empty');
    assert.ok(rows.some((v: any) => v.avgScore >= 3 && v.avgScore <= 5), '3-5 Score is empty');

    assert.ok(rows.some((v: any) => v.isComplete === false), 'no incomplete report');
    assert.ok(rows.some((v: any) => v.isComplete === true), 'no complete report');

    // Same shape as the notification recency check above: a day index rather
    // than matchesDateRange, because DATE_RANGE_OPTIONS includes a custom range
    // that cannot match without an encoded value.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const dayIndex = (iso: string) => {
      const d = new Date(iso);
      d.setHours(0, 0, 0, 0);
      return Math.round((startOfToday.getTime() - d.getTime()) / 86400000);
    };
    const days = rows.map((v: any) => dayIndex(v.updatedAt));
    assert.ok(days.some((d: number) => d === 0), 'Today is empty');
    assert.ok(days.some((d: number) => d === 1), 'Yesterday is empty');
    assert.ok(days.some((d: number) => d > 1 && d <= 7), 'Last 7 days is empty');
    assert.ok(days.some((d: number) => d > 7 && d <= 30), 'Last 30 days is empty');
    // Nothing updated in the future, whatever time of day this runs.
    assert.ok(days.every((d: number) => d >= 0));
  }],

  ['rvpSiteVisit detail sums to the record score and maps the nested answer enum', async () => {
    const r: any = await run(RVP_DETAIL, {id: 'rvp_1188'});
    assert.equal(r.errors, undefined);
    const d = r.data.rvpSiteVisit;
    assert.equal(d.reference, '#RVP-1188');
    assert.equal(d.visitType, 'FULL_SITE_VISIT');
    assert.equal(d.sections.length, 10);

    assert.equal(d.sections.reduce((n: number, s: any) => n + s.score, 0), d.score);
    assert.equal(d.sections.reduce((n: number, s: any) => n + s.scoreMax, 0), d.scoreMax);

    // The enum sits three levels down. A toWire that only mapped the top level
    // would serve 'Yes' here and graphql would reject it — this is the check
    // that catches a mapper which forgot to recurse.
    const answers = d.sections.flatMap((s: any) => s.groups.flatMap((g: any) => g.answers));
    assert.equal(answers.length, 74);
    assert.ok(answers.every((a: any) => a.answer === 'YES' || a.answer === 'NO'));
    assert.equal(answers.filter((a: any) => a.answer === 'YES').length, d.score);
    // A note only ever accompanies a No.
    assert.ok(answers.every((a: any) => a.answer === 'NO' || a.note === ''));

    // The incomplete rows are short of the tree, which is what isComplete reads.
    const partial: any = await run(RVP_DETAIL, {id: 'rvp_1147'});
    const p = partial.data.rvpSiteVisit;
    assert.equal(p.isComplete, false);
    const partialAnswers = p.sections.flatMap((s: any) => s.groups.flatMap((g: any) => g.answers));
    assert.equal(partialAnswers.length, 63);
    assert.equal(p.scoreMax, 74);
  }],

  ['an unknown rvpSiteVisit id resolves null rather than throwing', async () => {
    const r: any = await run(RVP_DETAIL, {id: 'nope'});
    assert.equal(r.errors, undefined);
    assert.equal(r.data.rvpSiteVisit, null);
  }],

  ['rvpSiteVisitFormOptions serves the reserved reference and the whole question tree', async () => {
    const r: any = await run(RVP_FORM_OPTIONS, {p: 'p1'});
    assert.equal(r.errors, undefined);
    const o = r.data.rvpSiteVisitFormOptions;
    assert.equal(o.nextReference, '#RVP-1189');
    assert.equal(o.programs.length, 16);
    assert.deepEqual(o.visitTypes, ['FULL_SITE_VISIT', 'DROP_IN_VISIT', 'SPECIAL_PURPOSE']);
    assert.equal(o.operationManagers.length, 10);
    assert.equal(o.sections.length, 10);
    const served = o.sections.reduce(
      (n: number, s: any) => n + s.groups.reduce((m: number, g: any) => m + g.questions.length, 0),
      0,
    );
    assert.equal(served, RVP_TOTAL_QUESTIONS);
    // Only the two Field Operations visibility groups ask for a window.
    const timed = o.sections.flatMap((s: any) => s.groups).filter((g: any) => g.requiresTime);
    assert.equal(timed.length, 2);
  }],

  ['createRvpSiteVisit scores from the answers, not from anything the client claims', async () => {
    const created: any = await run(
      RVP_CREATE,
      {p: 'p1', input: {...RVP_INPUT_BASE, sections: rvpAnswers(40, 10)}},
      null,
    );
    assert.equal(created.errors, undefined);
    const d = created.data.createRvpSiteVisit;
    assert.equal(d.reference, '#RVP-1189');
    assert.equal(d.score, 40);
    assert.equal(d.scoreMax, RVP_TOTAL_QUESTIONS);
    assert.equal(d.avgScore, Math.round((40 / RVP_TOTAL_QUESTIONS) * 5 * 10) / 10);
    // 50 of 74 answered, so it is not complete.
    assert.equal(d.isComplete, false);
    // The position comes from the roster, never from the input.
    assert.equal(d.leaderPosition, 'Divisional Vice President');
    assert.equal(d.reviewedBy, 'You');

    // Section scores still sum to the whole, and the tail section is untouched.
    assert.equal(d.sections.reduce((n: number, s: any) => n + s.score, 0), 40);
    assert.equal(d.sections.reduce((n: number, s: any) => n + s.scoreMax, 0), RVP_TOTAL_QUESTIONS);
    assert.equal(d.sections[d.sections.length - 1].groups[0].answers.length, 0);

    await run('mutation D($id: ID!) { deleteRvpSiteVisit(id: $id) }', {id: d.id});
  }],

  ['createRvpSiteVisit drops a note on a Yes, a reason on a full visit, and an unknown key', async () => {
    const sections = rvpAnswers(2, 1);
    // A key the server's tree does not contain must not become a stored answer.
    sections[0].groups[0].answers.push({key: 'field.g0.qNOPE', answer: 'YES', note: 'x', images: []});

    const created: any = await run(RVP_CREATE, {
      p: 'p1',
      input: {...RVP_INPUT_BASE, reasonForVisit: 'should be dropped', sections},
    });
    assert.equal(created.errors, undefined);
    const d = created.data.createRvpSiteVisit;

    // FULL_SITE_VISIT carries no reason, whatever was sent.
    assert.equal(d.reasonForVisit, '');
    // Three real answers, the phantom key dropped.
    const answers = d.sections.flatMap((s: any) => s.groups.flatMap((g: any) => g.answers));
    assert.equal(answers.length, 3);
    assert.equal(d.score, 2);
    // Every answer carried 'note text'; only the No may keep it.
    assert.ok(answers.every((a: any) => (a.answer === 'YES' ? a.note === '' : a.note === 'note text')));

    // A group the tree says asks for nothing stores nothing, even though the
    // input offered both.
    const bare = d.sections.find((s: any) => s.key === 'hr').groups[0];
    assert.equal(bare.howObserved, '');
    assert.equal(bare.notes, '');

    await run('mutation D($id: ID!) { deleteRvpSiteVisit(id: $id) }', {id: d.id});
  }],

  ['updateRvpSiteVisit re-scores and moves updatedBy, but never reviewedBy', async () => {
    // Updates a record this check creates rather than a seeded one: the slice-1
    // assertions pin rvp_1188's score and the list's length, and a check that
    // quietly rewrites shared fixtures breaks whichever check runs after it.
    const created: any = await run(RVP_CREATE, {
      p: 'p1',
      input: {...RVP_INPUT_BASE, sections: rvpAnswers(20, 5)},
    });
    const id = created.data.createRvpSiteVisit.id;
    const reviewer = created.data.createRvpSiteVisit.reviewedBy;
    assert.equal(created.data.createRvpSiteVisit.score, 20);

    const updated: any = await run(RVP_UPDATE, {
      id,
      input: {...RVP_INPUT_BASE, sections: rvpAnswers(12, 3)},
    });
    assert.equal(updated.errors, undefined);
    const u = updated.data.updateRvpSiteVisit;
    assert.equal(u.id, id);
    assert.equal(u.score, 12);
    assert.equal(u.isComplete, false);
    assert.equal(u.updatedBy, 'You');
    // Who filed it, not who last touched it.
    assert.equal(u.reviewedBy, reviewer);

    await run('mutation D($id: ID!) { deleteRvpSiteVisit(id: $id) }', {id});

    const missing: any = await run(RVP_UPDATE, {
      id: 'nope',
      input: {...RVP_INPUT_BASE, sections: rvpAnswers(1, 0)},
    });
    assert.ok(missing.errors, 'updating an unknown id should throw');
  }],

  ['deleteRvpSiteVisit removes the record and an unknown id throws', async () => {
    const created: any = await run(RVP_CREATE, {
      p: 'p1',
      input: {...RVP_INPUT_BASE, visitType: 'DROP_IN_VISIT', reasonForVisit: 'Kept', sections: rvpAnswers(3, 0)},
    });
    const d = created.data.createRvpSiteVisit;
    // A non-full visit does keep its reason.
    assert.equal(d.reasonForVisit, 'Kept');

    const before: any = await run(RVP_LIST, {p: 'p1'});
    const gone: any = await run('mutation D($id: ID!) { deleteRvpSiteVisit(id: $id) }', {id: d.id});
    assert.equal(gone.errors, undefined);
    assert.equal(gone.data.deleteRvpSiteVisit, d.id);

    const after: any = await run(RVP_LIST, {p: 'p1'});
    assert.equal(after.data.rvpSiteVisits.length, before.data.rvpSiteVisits.length - 1);
    const lookup: any = await run(RVP_DETAIL, {id: d.id});
    assert.equal(lookup.data.rvpSiteVisit, null);

    const missing: any = await run('mutation D($id: ID!) { deleteRvpSiteVisit(id: $id) }', {id: 'nope'});
    assert.ok(missing.errors, 'deleting an unknown id should throw');
  }],


  // ---- Off Hours Visit ----
  // Submit-only: there is no list or detail query to exercise, so these cover
  // the form options payload and the scoring the create mutation applies.
  ['off hours form options carry the zones, locked type and next reference', async () => {
    const r: any = await run(
      'query O($p: ID!) { offHoursVisitFormOptions(programId: $p) { nextReference type zones questions { key } } }',
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    const o = r.data.offHoursVisitFormOptions;
    assert.equal(o.zones.length, 8);
    assert.equal(o.zones[0], 'Downtown Louisville');
    assert.equal(o.type, 'Off Hour Visit');
    assert.equal(o.questions.length, 5);
    // Seeds top out at 1186, so the first form opens on the design's own id.
    assert.equal(o.nextReference, '#OHV-1187');
  }],

  ['off hours reveal rule survives the nested enum translation', async () => {
    const r: any = await run(
      'query O($p: ID!) { offHoursVisitFormOptions(programId: $p) { questions { key reveal numeric options { label points } } } }',
      {p: 'p1'},
    );
    assert.equal(r.errors, undefined);
    const qs = r.data.offHoursVisitFormOptions.questions;
    const byKey = Object.fromEntries(qs.map((q: any) => [q.key, q]));
    // 'yesNo'.toUpperCase() would be 'YESNO' and fail schema validation.
    assert.equal(byKey.q2.reveal, 'YES_NO');
    assert.equal(byKey.q1.reveal, 'ANY');
    assert.equal(byKey.q4.numeric, true);
    assert.equal(byKey.q1.numeric, false);
    // Q5 is scored in reverse — more violations is a worse score.
    assert.deepEqual(
      byKey.q5.options.map((o: any) => o.points),
      [4, 3, 2, 1, 0],
    );
  }],

  ['createOffHoursVisit scores from the server option table, not the labels', async () => {
    const m: any = await run(
      'mutation C($p: ID!, $i: OffHoursVisitInput!) { createOffHoursVisit(programId: $p, input: $i) { reference rating ratingMax checklist { question answer points note images } } }',
      {
        p: 'p1',
        i: {
          capturedAt: '2026-08-17T19:25:00',
          zone: 'RiverFront',
          auditNotes: 'Quiet walk.',
          answers: [
            {key: 'q1', answer: '25% - 80%', note: 'Six of nine on point.', images: ['file:///a.jpg']},
            {key: 'q2', answer: 'Yes', note: '', images: []},
            {key: 'q3', answer: 'No', note: 'Blower off route.', images: []},
            {key: 'q4', answer: '4', note: '', images: []},
            {key: 'q5', answer: '1', note: 'Gloves missing.', images: []},
          ],
        },
      },
    );
    assert.equal(m.errors, undefined);
    const v = m.data.createOffHoursVisit;
    assert.equal(v.reference, '#OHV-1187');
    assert.equal(v.checklist.length, 5);
    // 2 + 4 + 1 + 4 + 3 — note q5's '1' scores 3, so a build that read the
    // label as the score would land on 12 here rather than 14.
    assert.equal(v.rating, 14);
    assert.equal(v.ratingMax, 20);
    assert.equal(v.checklist[4].points, 3);
    assert.equal(v.checklist[0].images.length, 1);
    // Denormalized: the prompt is stored, not an index into the question list.
    assert.ok(v.checklist[0].question.startsWith('What percentage of staff'));
  }],

  ['the off hours reference sequence advances after a create', async () => {
    const r: any = await run(
      'query O($p: ID!) { offHoursVisitFormOptions(programId: $p) { nextReference } }',
      {p: 'p1'},
    );
    assert.equal(r.data.offHoursVisitFormOptions.nextReference, '#OHV-1188');
  }],

  ['createOffHoursVisit drops unresolvable answers and coalesces nulls', async () => {
    const m: any = await run(
      'mutation C($p: ID!, $i: OffHoursVisitInput!) { createOffHoursVisit(programId: $p, input: $i) { reference rating ratingMax auditNotes checklist { answer note images } } }',
      {
        p: 'p1',
        i: {
          capturedAt: '2026-08-17T20:00:00',
          zone: 'Beachmont',
          answers: [
            {key: 'q1', answer: 'More than 80%'},
            // Neither of these resolves — an unknown question, and a label
            // that isn't one of q2's options.
            {key: 'q99', answer: 'Yes'},
            {key: 'q2', answer: 'Maybe'},
          ],
        },
      },
    );
    assert.equal(m.errors, undefined);
    const v = m.data.createOffHoursVisit;
    assert.equal(v.reference, '#OHV-1188');
    assert.equal(v.checklist.length, 1);
    assert.equal(v.checklist[0].answer, 'More than 80%');
    // Nullable on the input, non-null on the record.
    assert.equal(v.checklist[0].note, '');
    assert.deepEqual(v.checklist[0].images, []);
    assert.equal(v.auditNotes, '');
    // ratingMax is the whole question set's ceiling, not the answered subset's.
    assert.equal(v.rating, 4);
    assert.equal(v.ratingMax, 20);
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
