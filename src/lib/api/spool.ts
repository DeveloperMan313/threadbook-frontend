import { ApiClient } from './client';
import type { SpoolInfo, UserSpoolsInfo } from '$lib/types';

const MockGetUserSpoolList: UserSpoolsInfo = {
  ok: true,
  spools: [
    {
      id: 1,
      name: 'Spool 1',
      banner_link: '',
      description: 'some desc 1',
      members: 103,
      threads: 13
    },
    {
      id: 2,
      name: 'Spool 2',
      banner_link: '',
      description: 'some desc 2',
      members: 51,
      threads: 4
    },
    {
      id: 3,
      name: 'Spool 3',
      banner_link: '',
      description: 'some desc 3',
      members: 255,
      threads: 28
    }
  ]
};

const MockGetSpoolInfoRes: SpoolInfo = {
  ok: true,
  id: 1,
  name: 'Spool 1',
  banner_link: '',
  description: 'some desc 1',
  members: 103,
  threads: 13
};

export const SpoolApi = {
  /**
   * Get spools which user is a member of
   * @returns {Promise<MockGetUserSpoolList>} - API response
   */
  async getUserSpoolList(): Promise<UserSpoolsInfo> {
    await new Promise((r) => setTimeout(r, 1500)); // emulate API delay
    return MockGetUserSpoolList;
    const response = await ApiClient.fetch('/spool/get', {
      method: 'GET',
      headers: {}
    });
    const json = await response.json();
    return { ok: response.ok, ...json };
  },

  /**
   * Get spool info by id
   * @param {number} spool_id - spool id
   * @returns {Promise<SpoolInfo>} - API response
   */
  async getSpoolInfo(spool_id: number): Promise<SpoolInfo> {
    return MockGetSpoolInfoRes;
    const response = await ApiClient.fetch('/spool/get', {
      method: 'GET',
      body: JSON.stringify({
        spool_id
      })
    });
    const json = await response.json();
    return { ok: response.ok, ...json };
  }
};
