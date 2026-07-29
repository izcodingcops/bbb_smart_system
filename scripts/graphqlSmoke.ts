import assert from 'node:assert/strict';
import {graphql} from 'graphql';
import {mockSchema} from '../src/graphql/mockSchema';

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
      {id: '#MT-40840'},
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
      {id: '#MT-00000'},
    );
    assert.equal(missing.data.maintenanceRequest, null);
  }],

  ['a typo fails loudly', async () => {
    const r: any = await run('query Bad { me { enable_shift_entry } }');
    assert.ok(r.errors?.[0]?.message.includes('Cannot query field'));
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
