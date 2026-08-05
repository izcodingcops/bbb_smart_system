import {makeExecutableSchema} from '@graphql-tools/schema';
import {authResolvers} from './features/auth/resolvers';
import {dispatchResolvers} from './features/dispatch/resolvers';
import {equipmentResolvers} from './features/equipment/resolvers';
import {fixtureResolvers} from './features/fixture/resolvers';
import {incidentResolvers} from './features/incident/resolvers';
import {maintenanceResolvers} from './features/maintenance/resolvers';
import {navigationResolvers} from './features/navigation/resolvers';
import {workResolvers} from './features/work/resolvers';
import {workLogResolvers} from './features/workLog/resolvers';
import {typeDefs} from './schema';

/**
 * A real executable schema, not a table of canned responses. Every document the
 * app sends is validated and executed against it, so a typo'd field or a wrong
 * variable type fails here exactly as it will against the gateway.
 */
export const mockSchema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    ...authResolvers,
    Query: {
      ...authResolvers.Query,
      ...navigationResolvers.Query,
      ...workResolvers.Query,
      ...equipmentResolvers.Query,
      ...maintenanceResolvers.Query,
      ...fixtureResolvers.Query,
      ...incidentResolvers.Query,
      ...dispatchResolvers.Query,
      ...workLogResolvers.Query,
    },
    Mutation: {
      ...authResolvers.Mutation,
      ...workResolvers.Mutation,
      ...maintenanceResolvers.Mutation,
      ...fixtureResolvers.Mutation,
      ...dispatchResolvers.Mutation,
      ...workLogResolvers.Mutation,
    },
  },
});
