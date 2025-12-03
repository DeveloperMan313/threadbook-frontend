import { centrifugeClient, SpoolApi } from '$lib/api';
import type {
  AccessLevel,
  SpoolProps,
  WsSpoolDeleted,
  WsSpoolInvited,
  WsSpoolUpdated
} from '$lib/types';

export const stateSpools = $state<{ spools: SpoolProps[]; currentSpoolId: number }>({
  spools: [],
  currentSpoolId: 0
});

export const stateSpoolsGetCurrentAccessLevel = (): AccessLevel => {
  return stateSpools.spools.find((s) => s.id === stateSpools.currentSpoolId)!.access_level;
};

export const stateSpoolsFetch = async () => {
  stateSpools.spools = (await SpoolApi.getUserSpoolList()).spools.map((s) => {
    return { ...s, access_level: s.is_creator ? 3 : 0 }; // TEMP, API should return access_level, not is_creator
  });
};

export const stateSpoolCreate = async (name: string, banner?: File) => {
  const response = await SpoolApi.createSpool({ name, banner });
  const newSpool = {
    id: response.spool_id,
    name: response.name,
    is_creator: true,
    access_level: 3,
    banner_link: response.banner_link,
    description: '',
    members: 0,
    threads: 0
  } as SpoolProps;
  stateSpoolsAdd(newSpool);
};

export const stateSpoolUpdate = async (spoolId: number, name: string, banner?: File) => {
  const response = await SpoolApi.updateSpool({ spool_id: spoolId, name, banner });
  const updatedSpool = {
    id: spoolId,
    ...response
  };
  stateSpoolsUpdate(updatedSpool);
};

export const stateSpoolLeave = async (spoolId: number) => {
  await SpoolApi.leaveFromSpool({ spool_id: spoolId });
  stateSpoolsDelete(spoolId);
};

export const stateSpoolsSetCurrentSpoolId = (spoolId: number) => {
  stateSpools.currentSpoolId = spoolId;
};

const stateSpoolsAdd = (spool: SpoolProps) => {
  stateSpools.spools = [...stateSpools.spools, spool];
};

const stateSpoolsUpdate = (spool: { id: number }) => {
  stateSpools.spools = stateSpools.spools.map((s) => (s.id === spool.id ? { ...s, ...spool } : s));
};

const stateSpoolsDelete = (spoolId: number) => {
  stateSpools.spools = stateSpools.spools.filter((s) => s.id !== spoolId);
};

export const subToSpoolEvents = () => {
  centrifugeClient.onUser('spool.invited', (payload: WsSpoolInvited) => {
    const newSpool: SpoolProps = {
      ...payload,
      is_creator: false,
      access_level: 0,
      description: '',
      members: 0,
      threads: 0
    };
    stateSpoolsAdd(newSpool);
  });

  centrifugeClient.onUser('spool.updated', (payload: WsSpoolUpdated) => {
    stateSpoolsUpdate(payload);
  });

  centrifugeClient.onUser('spool.deleted', (payload: WsSpoolDeleted) => {
    stateSpoolsDelete(payload.id);
  });
};
