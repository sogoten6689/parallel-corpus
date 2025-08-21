import { axiosInstance } from "../axios"
import { API } from "../constants"


export const uploadMaterDataFileApi = async (file: File, langCode: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("lang_code", langCode);

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

export const fetchMasterRowWords = async (page: number, limit: number,  langCode?: string, search?: string) => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("limit", String(limit));

  if (langCode) params.append("lang_code", langCode);
  if (search) params.append("search", search);
  return await axiosInstance.get(
    API.MASTER.ROW_WORD, { params }
  );

};
