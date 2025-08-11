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