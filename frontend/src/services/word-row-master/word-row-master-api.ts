import { axiosInstance } from "../axios";

export const fetchWordRowMasters = async (page: number, limit: number, lang_code?: string) => {
  const params = new URLSearchParams({
    skip: String((page - 1) * limit),
    limit: String(limit),
  });

  if (lang_code) params.append("lang_code", lang_code);

  const res = await axiosInstance.get("/word-row-master/", { params });
  return res.data;
};

export const getWordRowMasterCount = async (lang_code?: string) => {
  const params = new URLSearchParams();
  if (lang_code) params.append("lang_code", lang_code);

  const res = await axiosInstance.get("/word-row-master/count", { params });
  return res.data;
};
