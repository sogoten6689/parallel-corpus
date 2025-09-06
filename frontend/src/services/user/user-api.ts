import { axiosInstance } from "../axios"
import { API } from "../constants"

export const getUser = async (page: number, limit: number, search?: string) => {
  return await axiosInstance.get(
    API.USER.LIST,
    {
      params: {
        page: page,
        limit: limit,
        search: search
      }
    }
  )
}

export interface UpdateUserPayload {
  full_name?: string;
  date_of_birth?: string; // YYYY-MM-DD
  organization?: string;
  role?: string;
}

export const updateUserApi = async (id: number, payload: UpdateUserPayload) => {
  return await axiosInstance.put(API.USER.UPDATE(id), payload);
}