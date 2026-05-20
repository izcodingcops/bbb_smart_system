import {useAppSelector} from '../store';

export const GetPrograms = () => useAppSelector(state => state.program.programs);
export const GetSelectedProgram = () => useAppSelector(state => state.program.selectedProgram);
export const GetProgramLoading = () => useAppSelector(state => state.program.isLoading);
export const GetProgramError = () => useAppSelector(state => state.program.error);
