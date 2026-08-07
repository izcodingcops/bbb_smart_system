/**
 * Route table for the Dispatch tab's stack. Kept in its own file so the list
 * and detail screens can import the param list without importing the
 * navigator that renders them.
 */
export type DispatchStackParamList = {
  DispatchList: undefined;
  DispatchView: {
    id: string;
    /**
     * Handed back by the Add Incident route. Carries `reference` so the
     * detail screen can build its toast from this snapshot rather than from
     * `justAdded`, which is cleared the moment the user leaves the Incident
     * tab and would otherwise flip a still-visible "queued" toast to a false
     * "attached" one mid-display.
     */
     added?: {id: string; queued: boolean; reference: string};
    /** Handed back by the incident detail route after a delete. */
    deleted?: {id: string; reference: string};
  };
  /** Add Incident opened from inside a dispatch, so it attaches to that call. */
  DispatchAddIncident: {dispatchId: string};
  /**
   * `dispatchId` rides along so a delete can pop back to the dispatch it came
   * from — the incident detail itself has no other way to name it.
   */
  DispatchViewIncident: {id: string; dispatchId: string};
};
