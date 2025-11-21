import { ApiClient } from './client';
import type {
  SpoolProps,
  SpoolDockProps,
  GetSpoolInfoRequest,
  CreateSpoolRequest,
  LeaveSpoolRequest,
  InviteUsersToSpoolRequest
} from '$lib/types';

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
   * @returns {Promise<Array<SpoolProps>>} - API response
   */
  async getUserSpoolList(): Promise<Array<SpoolProps>> {
    // await new Promise((r) => setTimeout(r, 1500)); // emulate API delay
    // return MockGetUserSpoolList;
    const response = (await ApiClient.fetchJSON('/spool/user', {
      method: 'GET',
      headers: {}
    })) as { spools: Array<SpoolProps> };
    return response.spools;
  },

  /**
   * Get spool info by id
   * @param {GetSpoolInfoRequest} request - request object
   * @returns {Promise<SpoolProps>} - API response
   */
  async getSpoolInfo(request: GetSpoolInfoRequest): Promise<SpoolProps> {
    // return MockGetSpoolInfoRes;
    return ApiClient.fetchJSON(`/spool/${request.spool_id}`, {
      method: 'GET',
      body: JSON.stringify(request)
    }) as Promise<SpoolProps>;
  },

  /**
   * Create a new spool
   * @param {CreateSpoolRequest} request - request object with name and optional banner file
   */
  async createSpool(request: CreateSpoolRequest) {
    const formData = new FormData();
    formData.append('name', request.name);
    if (request.banner) {
      formData.append('banner', request.banner);
    }

    return ApiClient.fetchJSON('/spool', {
      method: 'POST',
      headers: {},
      body: formData
    });
  },

  /**
   * Leave from spool
   * @param {LeaveSpoolRequest} request - request object with spool_id
   */
  async leaveFromSpool(request: LeaveSpoolRequest) {
    return ApiClient.fetch('/spool/leave', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  },

  /**
   * Invite users to spool
   * @param {InviteUsersToSpoolRequest} request - request object with spool_id and username list
   */
  async inviteUsersToSpool(request: InviteUsersToSpoolRequest) {
    return ApiClient.fetch('/spool/invite', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }
};
