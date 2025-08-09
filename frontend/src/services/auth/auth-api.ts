import { axiosInstance } from "../axios"
import { API } from "../constants"

export const logInApi = async (data: {email: string, password: string}) => {
  return await axiosInstance.post(
    API.AUTH.LOGIN,
    data
  )
}


export const logOutApi = async (data: {}) => {
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