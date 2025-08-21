import { RowWord } from "@/types/row-word.type";
import { axiosInstance } from "../axios";
import type { Sentence } from "@/types/sentence.type";

export async function searchWordAPI(
  key: string,
  isMorph: boolean,
  lang_code?: string
): Promise<Record<string, RowWord>> {
  const res = await axiosInstance.get("/search-word", {
    params: { key, isMorph, lang_code },
  });
  return res.data as Record<string, RowWord>;
}

export async function searchPhraseAPI(
  key: string,
  lang_code?: string
): Promise<Record<string, RowWord[]>> {
  const res = await axiosInstance.get("/search-phrase", {
    params: { key, lang_code },
  });
  return res.data as Record<string, RowWord[]>;
}

export async function getSentencePairAPI(
  id: string,
  lang_src: string,
  lang_tgt: string
): Promise<{ sentence_1: Sentence; sentence_2: Sentence }> {
  const res = await axiosInstance.get("/sentence-pair", {
    params: { id, lang_src, lang_tgt },
  });
  return res.data as { sentence_1: Sentence; sentence_2: Sentence };
}
