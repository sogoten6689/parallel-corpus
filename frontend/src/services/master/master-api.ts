import { MasterRowWord } from "@/types/master-row-word.type";
import { axiosInstance } from "../axios"
import { API } from "../constants"


export const uploadMaterDataFileApi = async (file: File, langCode: string, langPair: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("lang_code", langCode);
  formData.append("lang_pair", langPair);

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

export const updateMasterRowWordApi = async (data: MasterRowWord) => {
  return await axiosInstance.put(
    API.MASTER.ROW_WORD_EIDT(data.id),
    data
  );
}


export const fetchDict = async (page: number, limit: number,  langCode: string, langPair: string, otherLangCode?: string, search?: string, is_morph?: boolean, is_phrase?: boolean) => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("limit", String(limit));
  params.append("is_morph", String(is_morph));
  params.append("is_phrase", String(is_phrase));
  params.append("lang_pair", langPair);

  if (langCode) params.append("lang_code", langCode);
  if (otherLangCode) params.append("other_lang_code", otherLangCode);
  if (search) params.append("search", search);
  return await axiosInstance.get(
    API.MASTER.DICID, { params }
  );
};

export const fetchDictWithTagFilter = async (
  page: number, 
  limit: number, 
  langCode: string, 
  langPair: string, 
  otherLangCode: string, 
  search: string, 
  is_morph: boolean, 
  tagType: string, 
  tagValue: string
) => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("limit", String(limit));
  params.append("is_morph", String(is_morph));
  params.append("lang_pair", langPair);
  params.append("lang_code", langCode);
  params.append("other_lang_code", otherLangCode);
  params.append("search", search);
  params.append("tag_type", tagType);
  params.append("tag_value", tagValue);
  
  return await axiosInstance.get(
    API.MASTER.DICID_WITH_TAG, { params }
  );
};

export const getAlignSentence = async (idString: string, langCode: string, langPair: string, otherLangCode: string) => {
  const params = new URLSearchParams();
  params.append("id_string", idString);
  params.append("lang_code", langCode);
  params.append("other_lang_code", otherLangCode);
  params.append("lang_pair", langPair);
  return await axiosInstance.get(
    API.MASTER.ALIGN_SENTENCE, { params }
  );
};

export const fetchPOS = async (langCode?: string) => {
  const params = new URLSearchParams();
  if (langCode) params.append("lang_code", langCode);
  return await axiosInstance.get(API.MASTER.POS, { params });
};

export const fetchNER = async (langCode?: string) => {
  const params = new URLSearchParams();
  if (langCode) params.append("lang_code", langCode);
  return await axiosInstance.get(API.MASTER.NER, { params });
};

export const fetchSemantic = async (langCode?: string) => {
  const params = new URLSearchParams();
  if (langCode) params.append("lang_code", langCode);
  return await axiosInstance.get(API.MASTER.SEMANTIC, { params });
};

export const fetchSemanticWithTag = async (langCode?: string, tagType?: string, tagValue?: string) => {
  const params = new URLSearchParams();
  if (langCode) params.append("lang_code", langCode);
  if (tagType) params.append("tag_type", tagType);
  if (tagValue) params.append("tag_value", tagValue);
  return await axiosInstance.get(API.MASTER.SEMANTIC_WITH_TAG, { params });
};
