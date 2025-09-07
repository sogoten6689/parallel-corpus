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
    UPDATE: (id: number) => string
    },
    MASTER: {
        IMPORT_UPLOAD: string
        ROW_WORD: string
        ROW_WORD_EIDT: (id: number) => string
        DICID: string
        DICID_WITH_TAG: string
        ALIGN_SENTENCE: string
        POS: string
        NER: string
        SEMANTIC: string
        SEMANTIC_WITH_TAG: string,
        STATISTICS: string
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
    LIST: "/users",
    UPDATE: (id: number) => `/users/${id}`
    },
    MASTER: {
        IMPORT_UPLOAD: "api/master/import",
        ROW_WORD: "api/master/words",
        ROW_WORD_EIDT: (id: number) => `api/master/words/${id}`,
        DICID: "api/master/dicid",
        DICID_WITH_TAG: "api/master/dicid-with-tag",
        ALIGN_SENTENCE: "api/master/align-sentence",
        POS: "api/master/pos",
        NER: "api/master/ner",
        SEMANTIC: "api/master/semantic",
        SEMANTIC_WITH_TAG: "api/master/semantic-with-tag",
        STATISTICS: "api/master/statistics",
    }
}
