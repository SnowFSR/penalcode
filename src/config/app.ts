type AppConfigType = {
    name: string,
    github: {
        title: string,
        url: string
    },
    author: {
        name: string,
        url: string
    },
}

export const appConfig: AppConfigType = {
    name: import.meta.env.VITE_APP_NAME ?? "Sample App",
    github: {
        title: "Unscripted.gg Penal Code",
        url: "https://github.com/SnowFSR/penalcode",
    },
    author: {
        name: "Snowthisway",
        url: "https://github.com/snowthisway/",
    }
}

export const baseUrl = import.meta.env.VITE_BASE_URL ?? ""
