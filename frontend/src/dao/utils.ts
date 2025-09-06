import { RowWord } from "@/types/row-word.type";

export function containsSublistUnordered<T>(mainList: T[], subList: T[]): boolean {
    const mainSet = new Set(mainList);
    const subSet = new Set(subList);

    for (const item of subSet) {
        if (!mainSet.has(item)) {
            return false;
        }
    }
    return true;
}

export function convertLemma(text: string): string {
    let result = "";
    if (text.trim().length === 0) {
        return result;
    }

    const tus = text.split("_");
    for (const tu of tus) {
        let rs = "";
        let dau = "";
        for (const c of tu) {
            let kitu = c;
            switch (c) {
                case 'á':
                case 'Á':
                    kitu = "a";
                    dau += "1";
                    break;
                case 'à':
                case 'À':
                    kitu = "a";
                    dau += "2";
                    break;
                case 'ả':
                case 'Ả':
                    kitu = "a";
                    dau += "3";
                    break;
                case 'ã':
                case 'Ã':
                    kitu = "a";
                    dau += "4";
                    break;
                case 'ạ':
                case 'Ạ':
                    kitu = "a";
                    dau += "5";
                    break;

                case 'ă':
                case 'Ă':
                    kitu = "aw";
                    dau += "";
                    break;
                case 'ắ':
                case 'Ắ':
                    kitu = "aw";
                    dau += "1";
                    break;
                case 'ằ':
                case 'Ằ':
                    kitu = "aw";
                    dau += "2";
                    break;
                case 'ẳ':
                case 'Ẳ':
                    kitu = "aw";
                    dau += "3";
                    break;
                case 'ẵ':
                case 'Ẵ':
                    kitu = "aw";
                    dau += "4";
                    break;
                case 'ặ':
                case 'Ặ':
                    kitu = "aw";
                    dau += "5";
                    break;

                case 'â':
                case 'Â':
                    kitu = "aa";
                    dau += "";
                    break;
                case 'ấ':
                case 'Ấ':
                    kitu = "aa";
                    dau += "1";
                    break;
                case 'ầ':
                case 'Ầ':
                    kitu = "aa";
                    dau += "2";
                    break;
                case 'ẩ':
                case 'Ẩ':
                    kitu = "aa";
                    dau += "3";
                    break;
                case 'ẫ':
                case 'Ẫ':
                    kitu = "aa";
                    dau += "4";
                    break;
                case 'ậ':
                case 'Ậ':
                    kitu = "aa";
                    dau += "5";
                    break;

                case 'đ':
                case 'Đ':
                    kitu = "dd";
                    dau += "";
                    break;

                case 'é':
                case 'É':
                    kitu = "e";
                    dau += "1";
                    break;
                case 'è':
                case 'È':
                    kitu = "e";
                    dau += "2";
                    break;
                case 'ẻ':
                case 'Ẻ':
                    kitu = "e";
                    dau += "3";
                    break;
                case 'ẽ':
                case 'Ẽ':
                    kitu = "e";
                    dau += "4";
                    break;
                case 'ẹ':
                case 'Ẹ':
                    kitu = "e";
                    dau += "5";
                    break;

                case 'ê':
                case 'Ê':
                    kitu = "ee";
                    dau += "";
                    break;
                case 'ế':
                case 'Ế':
                    kitu = "ee";
                    dau += "1";
                    break;
                case 'ề':
                case 'Ề':
                    kitu = "ee";
                    dau += "2";
                    break;
                case 'ể':
                case 'Ể':
                    kitu = "ee";
                    dau += "3";
                    break;
                case 'ễ':
                case 'Ễ':
                    kitu = "ee";
                    dau += "4";
                    break;
                case 'ệ':
                case 'Ệ':
                    kitu = "ee";
                    dau += "5";
                    break;

                case 'í':
                case 'Í':
                    kitu = "i";
                    dau += "1";
                    break;
                case 'ì':
                case 'Ì':
                    kitu = "i";
                    dau += "2";
                    break;
                case 'ỉ':
                case 'Ỉ':
                    kitu = "i";
                    dau += "3";
                    break;
                case 'ĩ':
                case 'Ĩ':
                    kitu = "i";
                    dau += "4";
                    break;
                case 'ị':
                case 'Ị':
                    kitu = "i";
                    dau += "5";
                    break;

                case 'ó':
                case 'Ó':
                    kitu = "o";
                    dau += "1";
                    break;
                case 'ò':
                case 'Ò':
                    kitu = "o";
                    dau += "2";
                    break;
                case 'ỏ':
                case 'Ỏ':
                    kitu = "o";
                    dau += "3";
                    break;
                case 'õ':
                case 'Õ':
                    kitu = "o";
                    dau += "4";
                    break;
                case 'ọ':
                case 'Ọ':
                    kitu = "o";
                    dau += "5";
                    break;

                case 'ô':
                case 'Ô':
                    kitu = "oo";
                    dau += "";
                    break;
                case 'ố':
                case 'Ố':
                    kitu = "oo";
                    dau += "1";
                    break;
                case 'ồ':
                case 'Ồ':
                    kitu = "oo";
                    dau += "2";
                    break;
                case 'ổ':
                case 'Ổ':
                    kitu = "oo";
                    dau += "3";
                    break;
                case 'ỗ':
                case 'Ỗ':
                    kitu = "oo";
                    dau += "4";
                    break;
                case 'ộ':
                case 'Ộ':
                    kitu = "oo";
                    dau += "5";
                    break;

                case 'ơ':
                case 'Ơ':
                    kitu = "ow";
                    dau += "";
                    break;
                case 'ớ':
                case 'Ớ':
                    kitu = "ow";
                    dau += "1";
                    break;
                case 'ờ':
                case 'Ờ':
                    kitu = "ow";
                    dau += "2";
                    break;
                case 'ở':
                case 'Ở':
                    kitu = "ow";
                    dau += "3";
                    break;
                case 'ỡ':
                case 'Ỡ':
                    kitu = "ow";
                    dau += "4";
                    break;
                case 'ợ':
                case 'Ợ':
                    kitu = "ow";
                    dau += "5";
                    break;

                case 'ú':
                case 'Ú':
                    kitu = "u";
                    dau += "1";
                    break;
                case 'ù':
                case 'Ù':
                    kitu = "u";
                    dau += "2";
                    break;
                case 'ủ':
                case 'Ủ':
                    kitu = "u";
                    dau += "3";
                    break;
                case 'ũ':
                case 'Ũ':
                    kitu = "u";
                    dau += "4";
                    break;
                case 'ụ':
                case 'Ụ':
                    kitu = "u";
                    dau += "5";
                    break;

                case 'ư':
                case 'Ư':
                    kitu = "uw";
                    dau += "";
                    break;
                case 'ứ':
                case 'Ứ':
                    kitu = "uw";
                    dau += "1";
                    break;
                case 'ừ':
                case 'Ừ':
                    kitu = "uw";
                    dau += "2";
                    break;
                case 'ử':
                case 'Ử':
                    kitu = "uw";
                    dau += "3";
                    break;
                case 'ữ':
                case 'Ữ':
                    kitu = "uw";
                    dau += "4";
                    break;
                case 'ự':
                case 'Ự':
                    kitu = "uw";
                    dau += "5";
                    break;

                case 'ý':
                case 'Ý':
                    kitu = "y";
                    dau += "1";
                    break;
                case 'ỳ':
                case 'Ỳ':
                    kitu = "y";
                    dau += "2";
                    break;
                case 'ỷ':
                case 'Ỷ':
                    kitu = "y";
                    dau += "3";
                    break;
                case 'ỹ':
                case 'Ỹ':
                    kitu = "y";
                    dau += "4";
                    break;
                case 'ỵ':
                case 'Ỵ':
                    kitu = "y";
                    dau += "5";
                    break;
            }
            rs += kitu;
        }
        rs += dau;
        result += rs + "_";
    }

    return result.slice(0, -1);
}

/**
 * Parse a tab-delimited line into a RowWord structure.
 * Expected order (min 10 fields):
 * 0: ID
 * 1: Word
 * 2: Lemma
 * 3: Links
 * 4: Morph
 * 5: POS
 * 6: Phrase
 * 7: Grm
 * 8: NER
 * 9: Semantic
 * 10 (optional): Lang_code
 * Any extra fields are ignored. Missing optional Lang_code becomes ''.
 */
export const parseLine = (line: string): RowWord => {
    if (!line || !line.trim()) {
        return {
            ID: '', ID_sen: '', Word: '', Lemma: '', Links: '', Morph: '', POS: '', Phrase: '', Grm: '', NER: '', Semantic: '', Lang_code: ''
        };
    }

    const rawFields = line.split('\t');
    // Ensure we have at least mandatory 10 fields
    if (rawFields.length < 10) {
        return {
            ID: '', ID_sen: '', Word: '', Lemma: '', Links: '', Morph: '', POS: '', Phrase: '', Grm: '', NER: '', Semantic: '', Lang_code: ''
        };
    }

    // Trim all fields
    const fields = rawFields.map(f => f.trim());

    const id = fields[0] || '';
    // Attempt to derive sentence ID: if pattern like XX<number>XX, fallback to id.
    let ID_sen = '';
    // Example heuristic: extract longest digit sequence
    const digitMatch = id.match(/\d+/g);
    if (digitMatch && digitMatch.length) {
        ID_sen = digitMatch.join('_');
    } else if (id.length > 4) {
        // fallback to previous slice logic if meaningful
        ID_sen = id.slice(2, -2) || id;
    } else {
        ID_sen = id;
    }

    return {
        ID: id,
        ID_sen,
        Word: fields[1] || '',
        Lemma: fields[2] || '',
        Links: fields[3] || '',
        Morph: fields[4] || '',
        POS: fields[5] || '',
        Phrase: fields[6] || '',
        Grm: fields[7] || '',
        NER: fields[8] || '',
        Semantic: fields[9] || '',
        Lang_code: fields[10] || ''
    };
};

/**
 * Detect machine/browser locale (client-side) and map to supported codes.
 * Currently supports 'vi' and 'en'; defaults to fallback (default 'en').
 * Safe for SSR: returns fallback when navigator / Intl not available.
 */
export function getMachineLocale(fallback: 'en' | 'vi' = 'en'): 'en' | 'vi' {
    try {
        let locale = '';
        if (typeof navigator !== 'undefined' && navigator.language) {
            locale = navigator.language.toLowerCase();
        } else if (typeof Intl !== 'undefined') {
            locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
        }
        if (locale.startsWith('vi')) return 'vi';
        if (locale.startsWith('en')) return 'en';
        return fallback;
    } catch {
        return fallback;
    }
}