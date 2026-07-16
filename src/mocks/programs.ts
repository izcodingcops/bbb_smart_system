import {Program} from '../types/shift';

export const MOCK_PROGRAMS = [
  {id: 'p1', name: 'Downtown Denver BID', address: '16th Street Mall · Denver, CO'},
  {id: 'p2', name: 'Cherry Creek North BID', address: '2nd & Fillmore · Denver, CO'},
  {id: 'p3', name: 'RiNo Art District', address: 'Larimer Street · Denver, CO'},
  {
    id: 'p4',
    name: 'Golden Triangle Creative District',
    address: 'Bannock Street · Denver, CO',
  },
  {id: 'p5', name: 'Five Points BID', address: 'Welton Street · Denver, CO'},
  {id: 'p6', name: 'LoHi District', address: '32nd Avenue · Denver, CO'},
  {id: 'p7', name: 'South Broadway BID', address: 'S Broadway · Denver, CO'},
  {
    id: 'p8',
    name: 'Union Station District',
    address: 'Wynkoop Street · Denver, CO',
  },
] satisfies Program[];
