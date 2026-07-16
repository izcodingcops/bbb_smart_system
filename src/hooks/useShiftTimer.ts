import {useEffect, useState} from 'react';
import {SHIFT_MS} from '../constants/shift';
import {GetShiftStartTime, GetShiftStopTime} from '../redux/shift/selectors';

/**
 * Live shift clock. Ticks once a second while running; pausing freezes the
 * display and the paused span is subtracted from elapsed time on resume.
 *
 * Keep this in the smallest component that renders the clock — every tick
 * re-renders its owner.
 */
export const useShiftTimer = () => {
  const startIso = GetShiftStartTime();
  const stopIso = GetShiftStopTime();

  const [now, setNow] = useState(Date.now());
  const [paused, setPaused] = useState(false);
  const [pausedAccum, setPausedAccum] = useState(0);
  const [pauseStart, setPauseStart] = useState<number | null>(null);

  useEffect(() => {
    if (paused) {
      return;
    }
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [paused]);

  const startDate = startIso ? new Date(startIso) : new Date();
  const startMs = startDate.getTime();
  const totalMs = stopIso ? new Date(stopIso).getTime() - startMs : SHIFT_MS;

  const effectiveNow = paused && pauseStart ? pauseStart : now;
  const elapsedMs = effectiveNow - startMs - pausedAccum;
  const remainingMs = totalMs - elapsedMs;
  const progress = Math.max(0, Math.min(1, elapsedMs / totalMs));

  const toggleBreak = () => {
    if (paused && pauseStart) {
      setPausedAccum(a => a + (Date.now() - pauseStart));
      setPauseStart(null);
      setPaused(false);
    } else {
      setPauseStart(Date.now());
      setPaused(true);
    }
  };

  return {startDate, elapsedMs, remainingMs, progress, paused, toggleBreak};
};
