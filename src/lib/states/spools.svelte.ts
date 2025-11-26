import type { SpoolProps } from '$lib/types';

export const stateSpools = $state<{ spools: SpoolProps[] }>({ spools: [] });

export const stateSpoolsAdd = (spool: SpoolProps) => {
  stateSpools.spools = [...stateSpools.spools, spool];
};
