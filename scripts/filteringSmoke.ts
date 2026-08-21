import assert from 'node:assert/strict';
import {optionsForField as maintenanceOptionsForField} from '../src/screens/maintenance/filtering';
import {optionsForField as incidentOptionsForField} from '../src/screens/incident/filtering';
import {optionsForField as fixtureOptionsForField} from '../src/screens/fixture/filtering';
import {optionsForField as poiOptionsForField} from '../src/screens/poi/filtering';
import {
  isSearchable as rvpIsSearchable,
  optionsForField as rvpOptionsForField,
} from '../src/screens/rvpSiteVisit/filtering';
import {
  isSearchable as obsIsSearchable,
  optionsForField as obsOptionsForField,
} from '../src/screens/observationReports/filtering';

// Real mock data + the real resolver-backing constants, for the
// formOptions-coverage checks below — deliberately not the hand-built `as
// any` fixtures the rest of this file uses, since only the real data can
// catch a real mock record carrying a value its own picklist doesn't offer.
import {MOCK_MAINTENANCE_REQUESTS} from '../src/mocks/maintenance';
import {AMBASSADORS as MAINT_AMBASSADORS, BUSINESS_NAMES as MAINT_BUSINESS_NAMES, MAINT_TYPES} from '../src/graphql/features/maintenance/store';
import {MOCK_INCIDENTS, MOCK_INCIDENT_FORM_OPTIONS} from '../src/mocks/incident';
import {MOCK_FIXTURES} from '../src/mocks/fixture';
import {FIXTURE_TYPES, ZONES as SHARED_ZONES} from '../src/graphql/features/shared/options';
import {MOCK_POIS, PERSON_TYPES} from '../src/mocks/poi';
import {MOCK_RVP_SITE_VISITS, RVP_PROGRAMS} from '../src/mocks/rvpSiteVisit';
import {MOCK_OBSERVATION_REPORTS, ZONES as OBSERVATION_ZONES} from '../src/mocks/observationReport';

type Check = [name: string, run: () => void];

/**
 * Asserts every distinct, non-empty value in `actual` appears in `allowed` —
 * the invariant that broke once already: a mock record carrying a value its
 * own formOptions picklist doesn't offer is unreachable via its own filter
 * chip, a real regression versus deriving options from loaded records.
 */
function assertValuesCovered(
  actual: (string | null | undefined)[],
  allowed: string[],
  label: string,
) {
  const allowedSet = new Set(allowed);
  const distinct = Array.from(new Set(actual.filter((v): v is string => !!v)));
  const missing = distinct.filter(v => !allowedSet.has(v));
  assert.deepEqual(missing, [], `${label}: missing from options — ${missing.join(', ')}`);
}

const checks: Check[] = [
  // Maintenance
  ['Maintenance: type reads from formOptions.types, not loaded requests', () => {
    const result = maintenanceOptionsForField([{type: 'Ignored'}] as any, 'type', {
      types: ['HVAC', 'Plumbing'],
    } as any);
    assert.deepEqual(result, [
      {value: 'HVAC', label: 'HVAC'},
      {value: 'Plumbing', label: 'Plumbing'},
    ]);
  }],

  ['Maintenance: type is empty when formOptions is null', () => {
    const result = maintenanceOptionsForField([], 'type', null);
    assert.deepEqual(result, []);
  }],

  ['Maintenance: businessName reads from formOptions.businessNames', () => {
    const result = maintenanceOptionsForField([], 'businessName', {
      businessNames: ['Acme Co'],
    } as any);
    assert.deepEqual(result, [{value: 'Acme Co', label: 'Acme Co'}]);
  }],

  ['Maintenance: assignedTo reads from formOptions.ambassadors plus Unassigned', () => {
    const result = maintenanceOptionsForField([], 'assignedTo', {
      ambassadors: ['Jane Doe'],
    } as any);
    assert.deepEqual(result, [
      {value: 'Jane Doe', label: 'Jane Doe'},
      {value: '__unassigned__', label: 'Unassigned'},
    ]);
  }],

  ['Maintenance: completedBy still derives from loaded requests, ignoring formOptions', () => {
    const requests = [{completedBy: 'Sam Lee'}, {completedBy: null}] as any;
    const result = maintenanceOptionsForField(requests, 'completedBy', null);
    assert.deepEqual(result, [{value: 'Sam Lee', label: 'Sam Lee'}]);
  }],

  ['Maintenance: status stays hardcoded regardless of formOptions', () => {
    const result = maintenanceOptionsForField([], 'status', null);
    assert.equal(result.some(o => o.value === 'Open'), true);
  }],

  // Incident
  ['Incident: type reads from formOptions.incidentTypes', () => {
    const result = incidentOptionsForField([], 'type', {incidentTypes: ['Theft']} as any);
    assert.deepEqual(result, [{value: 'Theft', label: 'Theft'}]);
  }],

  ['Incident: outcome reads from formOptions.outcomes', () => {
    const result = incidentOptionsForField([], 'outcome', {outcomes: ['Resolved']} as any);
    assert.deepEqual(result, [{value: 'Resolved', label: 'Resolved'}]);
  }],

  ['Incident: businessName reads from formOptions.businessNames', () => {
    const result = incidentOptionsForField([], 'businessName', {
      businessNames: ['Acme Co'],
    } as any);
    assert.deepEqual(result, [{value: 'Acme Co', label: 'Acme Co'}]);
  }],

  ['Incident: person still derives from loaded incidents, ignoring formOptions', () => {
    const incidents = [{person: 'John Smith'}] as any;
    const result = incidentOptionsForField(incidents, 'person', null);
    assert.deepEqual(result, [{value: 'John Smith', label: 'John Smith'}]);
  }],

  ['Incident: assignee still derives, plus Unassigned sentinel', () => {
    const incidents = [{assignee: {name: 'Ada'}}, {assignee: null}] as any;
    const result = incidentOptionsForField(incidents, 'assignee', null);
    assert.deepEqual(result, [
      {value: 'Ada', label: 'Ada'},
      {value: '__unassigned__', label: 'Unassigned'},
    ]);
  }],

  // Fixture
  ['Fixture: fixtureType reads from formOptions.fixtureTypes', () => {
    const result = fixtureOptionsForField([], 'fixtureType', {fixtureTypes: ['Bench']} as any);
    assert.deepEqual(result, [{value: 'Bench', label: 'Bench'}]);
  }],

  ['Fixture: zone reads from formOptions.zones', () => {
    const result = fixtureOptionsForField([], 'zone', {zones: ['Downtown']} as any);
    assert.deepEqual(result, [{value: 'Downtown', label: 'Downtown'}]);
  }],

  ['Fixture: status stays hardcoded regardless of formOptions', () => {
    const result = fixtureOptionsForField([], 'status', null);
    assert.equal(result.some(o => o.value === 'Active'), true);
  }],

  // POI
  ['POI: personType reads from formOptions.personTypes', () => {
    const result = poiOptionsForField([], 'personType', {personTypes: ['Resident']} as any, null);
    assert.deepEqual(result, [{value: 'Resident', label: 'Resident'}]);
  }],

  ['POI: zone reads from interactionFormOptions.zones', () => {
    const result = poiOptionsForField([], 'zone', null, {zones: ['Downtown']} as any);
    assert.deepEqual(result, [{value: 'Downtown', label: 'Downtown'}]);
  }],

  ['POI: person reads names from interactionFormOptions.people, deduped', () => {
    const opts = {
      people: [
        {id: 'p1', name: 'Ada'},
        {id: 'p2', name: 'Ada'},
      ],
    } as any;
    const result = poiOptionsForField([], 'person', null, opts);
    assert.deepEqual(result, [{value: 'Ada', label: 'Ada'}]);
  }],

  ['POI: createdBy still derives from loaded pois, ignoring both formOptions', () => {
    const pois = [{createdBy: {name: 'Sam'}}] as any;
    const result = poiOptionsForField(pois, 'createdBy', null, null);
    assert.deepEqual(result, [{value: 'Sam', label: 'Sam'}]);
  }],

  ['POI: disposition stays hardcoded regardless of formOptions', () => {
    const result = poiOptionsForField([], 'disposition', null, null);
    assert.equal(result.some(o => o.value === 'Active'), true);
  }],

  // RVP Site Visit
  ['RVP: program reads from the passed programs list, not the RVP_PROGRAMS constant', () => {
    const result = rvpOptionsForField('program', ['Custom Program']);
    assert.deepEqual(result, [{value: 'Custom Program', label: 'Custom Program'}]);
  }],

  ['RVP: reviewer still reads the hardcoded RVP_REVIEWERS constant', () => {
    const result = rvpOptionsForField('reviewer', []);
    assert.equal(result.length > 0, true);
  }],

  ['RVP: isSearchable takes the programs list into account', () => {
    const many = Array.from({length: 9}, (_, i) => `Program ${i}`);
    assert.equal(rvpIsSearchable('program', many), true);
    assert.equal(rvpIsSearchable('program', ['Only one']), false);
  }],

  // Observation Reports
  ['Observation Reports: zone reads from the passed zones list, not a hardcoded constant', () => {
    const result = obsOptionsForField('zone', ['Only Zone']);
    assert.deepEqual(result, [{value: 'Only Zone', label: 'Only Zone'}]);
  }],

  ['Observation Reports: reviewedBy still reads the hardcoded REVIEWED_BY_OPTIONS constant', () => {
    const result = obsOptionsForField('reviewedBy', []);
    assert.equal(result.length > 0, true);
  }],

  ['Observation Reports: isSearchable takes the zones list into account', () => {
    const many = Array.from({length: 9}, (_, i) => `Zone ${i}`);
    assert.equal(obsIsSearchable('zone', many), true);
    assert.equal(obsIsSearchable('zone', ['Only one']), false);
  }],

  // ---------------------------------------------------------------------
  // Real-data coverage: every distinct value a real mock record carries must
  // be reachable through its own field's real formOptions. Exercises the
  // actual mocks and the actual resolver-backing constants, not fixtures.
  // ---------------------------------------------------------------------

  ['Maintenance: every record.type is covered by the real formOptions.types', () => {
    assertValuesCovered(MOCK_MAINTENANCE_REQUESTS.map(r => r.type), MAINT_TYPES, 'Maintenance type');
  }],

  ['Maintenance: every record.businessName is covered by the real formOptions.businessNames', () => {
    assertValuesCovered(
      MOCK_MAINTENANCE_REQUESTS.map(r => r.businessName),
      MAINT_BUSINESS_NAMES,
      'Maintenance businessName',
    );
  }],

  ['Maintenance: every record.assignee.name is covered by the real formOptions.ambassadors', () => {
    assertValuesCovered(
      MOCK_MAINTENANCE_REQUESTS.map(r => r.assignee?.name ?? null),
      MAINT_AMBASSADORS,
      'Maintenance assignedTo',
    );
  }],

  ['Incident: every record.type is covered by the real formOptions.incidentTypes', () => {
    assertValuesCovered(
      MOCK_INCIDENTS.map(i => i.type),
      MOCK_INCIDENT_FORM_OPTIONS.incidentTypes,
      'Incident type',
    );
  }],

  ['Incident: every record.outcome is covered by the real formOptions.outcomes', () => {
    assertValuesCovered(
      MOCK_INCIDENTS.map(i => i.outcome),
      MOCK_INCIDENT_FORM_OPTIONS.outcomes,
      'Incident outcome',
    );
  }],

  ['Incident: every record.businessName is covered by the real formOptions.businessNames', () => {
    assertValuesCovered(
      MOCK_INCIDENTS.map(i => i.businessName),
      MOCK_INCIDENT_FORM_OPTIONS.businessNames,
      'Incident businessName',
    );
  }],

  ['Fixture: every record.fixtureType is covered by the real formOptions.fixtureTypes', () => {
    assertValuesCovered(MOCK_FIXTURES.map(f => f.fixtureType), FIXTURE_TYPES, 'Fixture fixtureType');
  }],

  ['Fixture: every record.zone is covered by the real formOptions.zones', () => {
    assertValuesCovered(MOCK_FIXTURES.map(f => f.zone), SHARED_ZONES, 'Fixture zone');
  }],

  ['POI: every record.personType is covered by the real formOptions.personTypes', () => {
    assertValuesCovered(MOCK_POIS.map(p => p.personType), PERSON_TYPES, 'POI personType');
  }],

  ['POI: every record.zone is covered by the real interactionFormOptions.zones', () => {
    assertValuesCovered(MOCK_POIS.map(p => p.zone), SHARED_ZONES, 'POI zone');
  }],

  // POI: `person` is skipped here on purpose — poiInteractionFormOptions.people
  // (see graphql/features/poi/resolvers.ts's `people()`) is
  // `poiStore.records.map(r => ({id: r.id, name: r.name}))`, i.e. read live
  // off the same store MOCK_POIS seeds. Every POI's name is trivially its own
  // option by construction; a coverage check here would just restate that.

  ['RVP Site Visit: every record.program is covered by the real formOptions.programs', () => {
    assertValuesCovered(MOCK_RVP_SITE_VISITS.map(v => v.program), RVP_PROGRAMS, 'RVP program');
  }],

  ['Observation Reports: every record.zone is covered by the real formOptions.zones', () => {
    assertValuesCovered(MOCK_OBSERVATION_REPORTS.map(r => r.zone), OBSERVATION_ZONES, 'Observation Reports zone');
  }],
];

function main() {
  let failed = 0;
  for (const [name, fn] of checks) {
    try {
      fn();
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
