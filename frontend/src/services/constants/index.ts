export interface API_PROPS {
    AUTH: {
        LOGIN: string
        SIGN_UP: string
        LOGOUT: string
        ME: string
    },
    USER: {
        MY_PROFILE: string
        LIST: string
    },
    MASTER: {
        IMPORT_UPLOAD: string
        ROW_WORD: string
        ROW_WORD_EIDT: (id: number) => string
        DICID: string
        ALIGN_SENTENCE: string
        POS: string
        NER: string
        SEMANTIC: string
    }
}

export const API: API_PROPS = {
    AUTH: {
        LOGIN: "/auth/login",
        SIGN_UP: "/auth/sign-up",
        LOGOUT: "/auth/logout",
        ME: "/auth/me"
    },
    USER: {
        MY_PROFILE: "/user/my-profile",
        LIST: "/users"
    },
    MASTER: {
        IMPORT_UPLOAD: "api/master/import",
        ROW_WORD: "api/master/words",
        ROW_WORD_EIDT: (id: number) => `api/master/words/${id}`,
        DICID: "api/master/dicid",
        ALIGN_SENTENCE: "api/master/align-sentence",
        POS: "api/master/pos",
        NER: "api/master/ner",
        SEMANTIC: "api/master/semantic",
    }
}
