import assert from 'node:assert/strict';
import {makeExecutableSchema} from '@graphql-tools/schema';
import {typeDefs} from '../src/graphql/schema';

type Check = [name: string, run: () => Promise<void> | void];

const checks: Check[] = [
  [
    'schema builds',
    () => {
      const schema = makeExecutableSchema({typeDefs, resolvers: {}});
      assert.ok(schema.getQueryType(), 'schema must define a Query root');
    },
  ],
];

async function main() {
  let failed = 0;
  for (const [name, run] of checks) {
    try {
      await run();
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

export {checks};
