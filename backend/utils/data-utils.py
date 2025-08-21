from __future__ import annotations

from typing import Dict, List, Optional, Tuple

from models import RowWord

def _format_sentence_spaces(sentence: Dict[str, str]) -> None:
	"""Trim spaces on Left/Center/Right in-place for a sentence dict."""
	sentence["Left"] = (sentence.get("Left") or "").strip()
	sentence["Center"] = (sentence.get("Center") or "").strip()
	sentence["Right"] = (sentence.get("Right") or "").strip()


def init_dict_sen_id(
	rows_1: List[RowWord],
	rows_2: List[RowWord],
) -> Tuple[Dict[str, Dict[str, int]], Dict[str, Dict[str, int]]]:
	"""
	Build sentence index dictionaries for two corpora.
	Returns a tuple: (dicId_1, dicId_2) mapping ID_sen -> PointView(start, end)
	"""
	dic1: Dict[str, Dict[str, int]] = {}
	dic2: Dict[str, Dict[str, int]] = {}

	# Build for rows_1
	if rows_1:
		id_sen = rows_1[0].ID_sen
		start = 0
		for i in range(len(rows_1)):
			# end at last element
			if i == len(rows_1) - 1:
				dic1[id_sen] = {"start": start, "end": i}
			# boundary detected
			if rows_1[i].ID_sen != id_sen:
				dic1[id_sen] = {"start": start, "end": i - 1}
				id_sen = rows_1[i].ID_sen
				start = i

	# Build for rows_2
	if rows_2:
		id_sen = rows_2[0].ID_sen
		start = 0
		for i in range(len(rows_2)):
			if i == len(rows_2) - 1:
				dic2[id_sen] = {"start": start, "end": i}
			if rows_2[i].ID_sen != id_sen:
				dic2[id_sen] = {"start": start, "end": i - 1}
				id_sen = rows_2[i].ID_sen
				start = i

	return dic1, dic2


def get_point(id_sentence: str, dic_id: Dict[str, Dict[str, int]]) -> Optional[Dict[str, int]]:
	return dic_id.get(id_sentence)


def get_sentence(row: RowWord, corpus: List[RowWord], dic_id: Dict[str, Dict[str, int]]) -> Dict[str, str]:
	"""
	Construct a sentence view around a specific row within its sentence span.
	Mirrors frontend logic using lexicographic comparison of RowWord.ID.
	"""
	p = get_point(row.ID_sen, dic_id)
	sentence: Dict[str, str] = {"ID_sen": "", "Left": "", "Center": "", "Right": ""}
	if not p:
		return sentence

	for i in range(p["start"], p["end"] + 1):
		word = corpus[i]
		if word.ID_sen == row.ID_sen:
			sentence["ID_sen"] = word.ID_sen
			if (word.ID or "") < (row.ID or ""):
				sentence["Left"] += f"{word.Word} "
			if word.ID == row.ID:
				sentence["Center"] = word.Word or ""
			if (word.ID or "") > (row.ID or ""):
				sentence["Right"] += f"{word.Word} "

	_format_sentence_spaces(sentence)
	return sentence


def get_sentence_other(row: RowWord, corpus: List[RowWord], dic_id: Dict[str, Dict[str, int]]) -> Dict[str, str]:
	"""
	Build the aligned sentence view on the other language using row.Links to decide
	which words form the Center span. Replicates the TS logic.
	"""
	p = get_point(row.ID_sen, dic_id)
	sentence: Dict[str, str] = {"ID_sen": "", "Left": "", "Center": "", "Right": ""}

	if not p:
		return sentence

	sentence["ID_sen"] = row.ID_sen or ""
	if (row.Links or "-") == "-":
		for i in range(p["start"], p["end"] + 1):
			r = corpus[i]
			sentence["Left"] = ""
			sentence["Center"] = "-"
			sentence["Right"] = f"{(r.Word or '').strip()} "
	else:
		links = [s for s in (row.Links or "").split(",") if s]
		for i in range(p["start"], p["end"] + 1):
			r = corpus[i]
			num = (r.ID or "")[-2:]

			first_link = links[0].zfill(2) if links else ""
			last_link = links[-1].zfill(2) if links else ""

			if num < first_link:
				sentence["Left"] += f"{r.Word or ''} "
			elif num > last_link:
				sentence["Right"] += f"{r.Word or ''} "
			else:
				sentence["Center"] += f"{r.Word or ''} "

	_format_sentence_spaces(sentence)
	return sentence


def get_pos_set(corpus: List[RowWord]) -> List[str]:
	pos_set = set()
	for rw in corpus:
		if (rw.POS or "-") != "-":
			pos_set.add(rw.POS)
	return sorted([p for p in pos_set if p is not None])


def get_ner_set(corpus: List[RowWord]) -> List[str]:
	ner_set = set()
	for rw in corpus:
		if (rw.NER or "-") != "-":
			ner_set.add(rw.NER)
	return sorted([n for n in ner_set if n is not None])


def get_sem_set(corpus: List[RowWord]) -> List[str]:
	sem_set = set()
	for rw in corpus:
		if (rw.Semantic or "-") != "-":
			sem_set.add(rw.Semantic)
	return sorted([s for s in sem_set if s is not None])
