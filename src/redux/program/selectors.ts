import {useAppSelector} from '../store';

export const GetSelectedProgram = () => useAppSelector(state => state.program.selectedProgram);
