import { axiosInstance } from "../axios"
import { API } from "../constants"

export interface UserProfile {
  email: string;
  full_name: string;
  date_of_birth: string;
  organization: string;
  id: number;
  role: string;
  created_at: string;
  updated_at: string | null;
}

export interface UpdateUserProfile {
  full_name: string;
  date_of_birth: string;
  organization: string;
}

export const logInApi = async (data: {email: string, password: string}) => {
  return await axiosInstance.post(
    API.AUTH.LOGIN,
    data
  )
}


export const logOutApi = async (data: Record<string, unknown>) => {
  return await axiosInstance.post(
    API.AUTH.LOGOUT,
    data
  )
}


export const getProfileMeApi = async () => {
  return await axiosInstance.get(
    API.AUTH.ME
  )
}



export const updateProfileMeApi = async (data: UpdateUserProfile) => {
  return await axiosInstance.put(
    API.AUTH.ME,
    {
      full_name: data.full_name,
      date_of_birth: data.date_of_birth,
      organization: data.organization
    }
  )
}

export const signUpApi = async (data: {email: string, password: string, fullName: string, organization: string, dateOfBirth: string}) => {
  return await axiosInstance.post(
    API.AUTH.SIGN_UP,
    {
      email: data.email,
      password: data.password,
      full_name: data.fullName,
      organization: data.organization,
      date_of_birth: data.dateOfBirth
    }
  )
}