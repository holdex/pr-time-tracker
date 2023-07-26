import { PUB_GITHUB_CLIENT_ID } from '$env/static/public'

type Config = {
    github: {
        baseUrl: string,
        clientId: string
    }
}

const config: Config = {
    github: {
        baseUrl: "https://github.com",
        clientId: PUB_GITHUB_CLIENT_ID
    }
};

export default config;