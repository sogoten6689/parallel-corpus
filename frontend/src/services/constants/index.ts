export interface API_PROPS {
    AUTH: {
        LOGIN: string
        SIGN_UP: string
        LOGOUT: string
        ME: string
    },
    USER: {
        MY_PROFILE: string
    },
}

export const API: API_PROPS = {
    AUTH: {
        LOGIN: "/auth/login",
        SIGN_UP: "/auth/sign-up",
        LOGOUT: "/auth/logout",
        ME: "/auth/me"
    },
    USER: {
        MY_PROFILE: "/user/my-profile"
    }
}
