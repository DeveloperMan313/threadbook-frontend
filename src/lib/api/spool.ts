import { ApiClient } from './client';
import type {
  SpoolProps,
  GetSpoolInfoRequest,
  CreateSpoolRequest,
  LeaveSpoolRequest,
  InviteUsersToSpoolRequest,
  CreateSpoolResponse,
  UpdateSpoolRequest,
  UpdateSpoolResponse,
  GetSpoolMembersRequest,
  GetSpoolMembersResponse,
  GetUserSpoolListResponse
} from '$lib/types';

const MockGetUserSpoolList: SpoolProps[] = {
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
   * @returns {GetUserSpoolListResponse} - API response
   */
  async getUserSpoolList(): Promise<GetUserSpoolListResponse> {
    // await new Promise((r) => setTimeout(r, 1500)); // emulate API delay
    // return MockGetUserSpoolList;
    const response = (await ApiClient.fetchJSON('/spool/user', {
      method: 'GET',
      headers: {}
    })) as GetUserSpoolListResponse;
    response.spools ||= []; // PATCH ugly ugly patch but ok ig
    return response;
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
   * @returns {Promise<CreateSpoolResponse>} - API response
   */
  async createSpool(request: CreateSpoolRequest): Promise<CreateSpoolResponse> {
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
   * Update existent spool
   * @param {UpdateSpoolRequest} request - request object with spool_id, name and optional banner file
   * @returns {Promise<UpdateSpoolResponse>} - API response
   */
  async updateSpool(request: UpdateSpoolRequest): Promise<UpdateSpoolResponse> {
    const formData = new FormData();
    formData.append('spool_id', request.spool_id.toString());
    formData.append('name', request.name);
    if (request.banner) {
      formData.append('banner', request.banner);
    }

    return ApiClient.fetchJSON('/spool', {
      method: 'PUT',
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
  },

  /**
   * Get spool members
   * @param {GetSpoolMembersRequest} request - request object
   * @returns {Promise<GetSpoolMembersResponse>} - API response
   */
  async getMembers(request: GetSpoolMembersRequest): Promise<GetSpoolMembersResponse> {
    return ApiClient.fetchJSON(`/spool/${request.spool_id}/members`, {
      method: 'GET',
      headers: {}
    });
  }
};
