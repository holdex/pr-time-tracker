import { MONGODB_URI, WEBHOOK_SECRET, GITHUB_APP_ID, GITHUB_PRIVATE_KEY } from "$env/static/private";

type Config = {
    mongoDBUri: string;
    mongoDBName: string;
    webhookSecret: string;
    github: {
        appId: string,
        privateKey: string,
    }
}

let config: Config = {
    webhookSecret: WEBHOOK_SECRET,
    mongoDBUri: MONGODB_URI,
    mongoDBName: "data",
    github: {
        appId: GITHUB_APP_ID,
        privateKey: GITHUB_PRIVATE_KEY
    }
}

export default config;