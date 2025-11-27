import { centrifugeClient, SpoolApi } from '$lib/api';
import type { SpoolProps, WsSpoolDeleted, WsSpoolInvited, WsSpoolUpdated } from '$lib/types';

export const stateSpools = $state<{ spools: SpoolProps[] }>({ spools: [] });

export const stateSpoolsFetch = async () => {
  stateSpools.spools = await SpoolApi.getUserSpoolList();
};

export const stateSpoolsAdd = (spool: SpoolProps) => {
  stateSpools.spools = [...stateSpools.spools, spool];
};

const stateSpoolsUpdate = (spool: SpoolProps) => {
  stateSpools.spools = stateSpools.spools.filter((s) => (s.id === spool.id ? spool : s));
};

const stateSpoolsDelete = (spoolId: number) => {
  stateSpools.spools = stateSpools.spools.filter((s) => s.id !== spoolId);
};

export const subToSpoolEvents = () => {
  centrifugeClient.onUser('spool.invited', (payload: WsSpoolInvited) => {
    const newSpool: SpoolProps = {
      ...payload,
      is_creator: false,
      description: '',
      members: 0,
      threads: 0
    };
    stateSpoolsAdd(newSpool);
  });

  centrifugeClient.onUser('spool.updated', (payload: WsSpoolUpdated) => {
    const updatedSpool: SpoolProps = {
      ...payload,
      is_creator: false,
      description: '',
      members: 0,
      threads: 0
    };
    stateSpoolsUpdate(updatedSpool);
  });

  centrifugeClient.onUser('spool.deleted', (payload: WsSpoolDeleted) => {
    stateSpoolsDelete(payload.id);
  });
};
