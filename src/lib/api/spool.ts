import { ApiClient } from './client';
import type { SpoolProps, SpoolDockProps } from '$lib/types';

const MockGetUserSpoolList: SpoolDockProps = {
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

const MockGetSpoolInfoRes: SpoolProps = {
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
   * @returns {Promise<SpoolDockProps>} - API response
   */
  async getUserSpoolList(): Promise<SpoolDockProps> {
    await new Promise((r) => setTimeout(r, 1500)); // emulate API delay
    return MockGetUserSpoolList;
    return ApiClient.fetchJSON('/spool/get', {
      method: 'GET',
      headers: {}
    }) as Promise<SpoolDockProps>;
  },

  /**
   * Get spool info by id
   * @param {number} spool_id - spool id
   * @returns {Promise<SpoolProps>} - API response
   */
  async getSpoolInfo(spool_id: number): Promise<SpoolProps> {
    return MockGetSpoolInfoRes;
    return ApiClient.fetchJSON('/spool/get', {
      method: 'GET',
      body: JSON.stringify({
        spool_id
      })
    }) as Promise<SpoolProps>;
  }
};
