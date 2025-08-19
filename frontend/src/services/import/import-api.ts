import { axiosInstance } from "../axios"
import { API } from "../constants"


export const uploadMaterDataFileApi = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return await axiosInstance.post(
    API.MASTER.IMPORT_UPLOAD, 
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};
