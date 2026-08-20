import assert from 'node:assert/strict';
import {optionsForField as maintenanceOptionsForField} from '../src/screens/maintenance/filtering';
import {optionsForField as incidentOptionsForField} from '../src/screens/incident/filtering';
import {optionsForField as fixtureOptionsForField} from '../src/screens/fixture/filtering';
import {optionsForField as poiOptionsForField} from '../src/screens/poi/filtering';
import {
  isSearchable as rvpIsSearchable,
  optionsForField as rvpOptionsForField,
} from '../src/screens/rvpSiteVisit/filtering';

type Check = [name: string, run: () => void];

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
