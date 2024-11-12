# PR Time Tracker

PR Time Tracker automates invoice generation processes and tracks core developer activity related to PRs and issues.

## Contributing

If you want to contribute, please follow Holdex [Developer Guidelines](https://github.com/holdex/developers).

## Possible issues docs

1. Cannot submit time: [see docs](docs/cannot-submit-time/not-found.md)

## Installing application

1. Access the App [public page](https://github.com/apps/pr-time-tracker)
2. Install the App under your organization
3. Invite the @pr-time-tracker into your organization and make him an owner
4. To customize the included repositories, go to "Settings" -> "GitHub Apps"

## Connect the installed organization with the Tracker flow

1. Add a record of your organization info in the Vercel env `APP_INTEGRATIONS_LIST`

```javascript
  { "id": "org_id", "name": "org_slug", "nodeId": "oracle_project_id"}
```

Where:

- `id` is the identifier used for defining jobs (can be any string)
- `name` - the GitHub organization slug
- `nodeId` - Holdex Oracle project ID, if no project is defined, use explicit value `337c06eb` for HX project column

2. Re-deploy the current production build so changes can take effect.

## Scripts

- postinstall: Sets up Husky for Git hooks.
- pre-dev: Executes a script to pull environment variables before starting development.
- dev: Starts the development server on port 3000 after executing the `pre-dev` script.
- build: Builds the project.
- preview: Previews the build.
- format: Formats the code using Prettier with plugins for Svelte and Pug.
- lint: Lints the codebase using ESLint with support for JavaScript, TypeScript, Svelte, and CommonJS.
  check: Syncs Svelte kit and checks the TypeScript configuration.
- type-check: type checks the TypeScript files without emitting any output.
- check:watch: Watches for changes and syncs Svelte kit while checking TypeScript.
- proxy: Sets up ngrok to proxy requests to the development server with a specific domain.

## Local Development Setup

1. Clone this repository

1. Setup `docker` and `docker compose` for your installation **Docker** ([Docker documentation](https://docs.docker.com/))

1. Make GitHub Access Token for installing some of the hosted dependencies:

    - Create a **GitHub Classic Access Token** with the necessary permissions <https://github.com/settings/tokens>.

      <details>
        <summary>
          Github access token with `read:packages` access permission
        </summary>

        ![GitHub Access Token Setup](./docs/images/local-development-setup/github-access-token.png)
      </details>


1. Copy `.npmrc.example` to `.npmrc` in the root folder and replace NPM_TOKEN with your generated GitHub access token.

1. Setup **Telebit** ([Telebit Cloud](https://telebit.cloud/))

1. Setup **Self Hosted Trigger.dev v2 with Supabase** following this guide: https://trigger.dev/docs/documentation/guides/self-hosting/supabase#self-host-trigger-dev-with-docker-compose

1. **Start the Proxy Server**: Run the following command:
   npm run trigger-dev:proxy

1. **Set Telebit URL**: Use the forwarding URL provided by Telebit for `LOGIN_ORIGIN` and `API_ORIGIN` in your Docker container environment variables.

1. **Set Up Docker**:
   - Change to the `container` directory:
     cd container
   - Run Docker Compose and wait for the configuration to complete:
     docker compose up

1. **Download Environment Variables**: Run the following command to download the required environment variables:
   npm run pre-dev


1. **Install Dependencies**: Run the following command to install all project dependencies:
   pnpm install

1. **Define Development Endpoint**:
   - In the Trigger dev UI, set a development endpoint with the following URL:
     https://alert-seemingly-moccasin.ngrok-free.app/api/trigger

1. **Set Up Trigger Environment Variables**:
   - Add the following lines to your `.env` file:
     TRIGGER_API_KEY="api_key"
     TRIGGER_API_URL="same as LOGIN_ORIGIN"
     TRIGGER_PROJECT_ID="project_id"
   - Update `project_id` in the `package.json` file to match the `TRIGGER_PROJECT_ID` value.

1. **Start the Development Server**: Run the following command to start the development server on port 3000:
   pnpm run dev-only

1. **Establish Proxy Connection**: Run the following command to start the proxy connection:
   npm run proxy

1. **Database Connection**:
   - Use `MongoDB Compass` to connect to the database using the `MONGODB_URI` environment variable.
