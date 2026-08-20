import assert from 'node:assert/strict';
import {optionsForField as maintenanceOptionsForField} from '../src/screens/maintenance/filtering';

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
