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

### Requirements

1. `git` <https://git-scm.com/downloads>
1. `docker` <https://docs.docker.com/>
1. `nodejs` <https://nodejs.org/en/download/package-manager>
1. `pnpm` <https://pnpm.io/installation>

### Steps and Setups

1.  Clone this repository
1.  Make GitHub Access Token for installing some of the hosted dependencies:

    - Create a **GitHub Classic Access Token** with the necessary permissions <https://github.com/settings/tokens>.

      <details>
        <summary>
          Github access token with `read:packages` access permission
        </summary>

      ![GitHub Access Token Setup](./docs/images/local-development-setup/github-access-token.png)

      </details>

1.  Copy `.npmrc.example` to `.npmrc` in the root folder and replace the `NPM_TOKEN` with your generated GitHub access token.

1.  Install the dependencies `pnpm install`

    <details>
      <summary>
      You should have this if you setup your token properly with proper permission
      </summary>

    ![Project Dependencies Installation](./docs/images/local-development-setup/dependencies-installations.png)

    </details>

1.  Setup **Telebit** <https://telebit.cloud/>

    <details>
      <summary>
      Following the telebit setup you will have these, take note of your own unique telebit address.
      </summary>

    ![Telebit Setup 1](./docs/images/local-development-setup/telebit-setup-1.png)

    ![Telebit Setup 2](./docs/images/local-development-setup/telebit-setup-2.png)
    </details>

1.  Setup your **Supabase Project** for Trigger.dev v2 based on this guide: <https://v2docs.trigger.dev/documentation/guides/self-hosting/supabase> **_(Optional)_**

    You can skip this step if you don't need to run your own supabase for Trigger.dev v2. We provide a shared supabase project for development purpose that you can use.

    But if you for some reason have a problem with the shared supabase project, you can follow this guide to create your own supabase project.

    - You can follow this setup guide <https://v2docs.trigger.dev/documentation/guides/self-hosting/supabase#create-a-supabase-db>
    - Create your supabase project for trigger.dev
      <details>
        <summary>
        When creating the project, take note of your Supabase DB uri and password.
        </summary>

      ![Supabase DB Setup 1](./docs/images/local-development-setup/supabase-db-setup-1.png)

      ![Supabase DB Setup 2](./docs/images/local-development-setup/supabase-db-setup-2.png)

        </details>

    - Go to the `/container` folder
    - Duplicate the `.env.example` to `.env`
    - In the `.env` file change the `DATABASE_URL` and `DIRECT_URL` you created in the Supabase DB creation step (don't forget to adjust with your own password).

      ```shell
        # From this
        DATABASE_URL=postgresql://postgres.phtaofoaormwpxwrwtkw:YZHPcdhJEwOUcK05@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?schema=triggerdotdev&pgbouncer=true

        DIRECT_URL=postgresql://postgres.phtaofoaormwpxwrwtkw:YZHPcdhJEwOUcK05@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?schema=triggerdotdev

        # To this (EXAMPLE)
        DATABASE_URL=postgresql://postgres.arnehavoxpuewazwvpph:YOUR-PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?schema=triggerdotdev&pgbouncer=true

        DIRECT_URL=postgresql://postgres.arnehavoxpuewazwvpph:YOUR-PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?schema=triggerdotdev

      ```

1.  Setup **Local Trigger.dev v2 with Supabase DB**

    - Start proxy server for `localhost:3030` to Telebit `pnpm trigger-dev:proxy`

      <details>

      ![Telebit Proxy](./docs/images/local-development-setup/telebit-proxy.png)

      </details>

    - Go to the `/container` folder
    - Duplicate the `.env.example` to `.env`
    - In the `.env` file change the `LOGIN_ORIGIN` and `API_ORIGIN` with the forwarding URL from telebit above, e.g:

      ```shell
        # From this
        LOGIN_ORIGIN=https://alert-seemingly-moccasin.telebit.io
        APP_ORIGIN=https://alert-seemingly-moccasin.telebit.io

        # To this (EXAMPLE)
        LOGIN_ORIGIN=https://shaggy-termite-71.telebit.io
        APP_ORIGIN=https://shaggy-termite-71.telebit.io
      ```

    - Run `docker compose up` within the container. Make sure you don't have running redis that use port `0.0.0.0:6379`. If you fail to run this see **Possible issues** on the bottom.

      <details>
        You should see this successful docker compose

      ![Docker Compose Success](./docs/images/local-development-setup/docker-compose-up-success.png)

      </details>

    - You should be able to access your local Trigger.dev using the forwarding URL from `pnpm trigger-dev:proxy` above e.g: https://shaggy-termite-71.telebit.io/

      <details>
        You should see this successful docker compose

      ![Docker Compose Success](./docs/images/local-development-setup/docker-compose-up-success.png)

      </details>

    - Setup your local account and triggerdotdev project

      <details>

      Register your email here

      ![Local Triggerdotdev 2](./docs/images/local-development-setup/local-triggerdotdev-2.png)

      You'll get a login url from `docker` container

      ![Local Triggerdotdev 3](./docs/images/local-development-setup/local-triggerdotdev-3.png)

      Copy and paste to browser to access and you'll be redirected to your project.

      ![Local Triggerdotdev 4](./docs/images/local-development-setup/local-triggerdotdev-4.png)

      </details>

    - Go to the root path and download the environment variables using `pnpm pre-dev` and you will see a new file `.env` on root

    - Take note of the Trigger.dev API Keys in Trigger dev UI (Environment & API Keys) and change the `TRIGGER_API_KEY` and `TRIGGER_API_URL` in the `.env` file

      ```shell

        # API Key from triggerdotdev UI
        TRIGGER_API_KEY="tr_dev_YIHNyqRKaKYt7lJ7hwF2"

        # URL from telebit forwarding proxy for accessing local triggerdotdev
        TRIGGER_API_URL="https://shaggy-termite-71.telebit.io"

        # slug for your created project in triggerdotdev (you can find this in the URL)
        TRIGGER_PROJECT_ID="pr-time-tracker-lmz0"
      ```

      <details>

      ![Local Triggerdotdev 7](./docs/images/local-development-setup/local-triggerdotdev-7.png)

      </details>

    - Run local dev of the project `pnpm dev-only`

    - Run ngrok proxy for the local dev project using `pnpm proxy`

      <details>

      ![Local Triggerdotdev 8](./docs/images/local-development-setup/local-triggerdotdev-8.png)

      </details>

    - In the Trigger dev UI (Environment & API Keys), set a development endpoint with the following URL:
      `https://alert-seemingly-moccasin.ngrok-free.app/api/trigger`

      <details>

      ![Local Triggerdotdev 5](./docs/images/local-development-setup/local-triggerdotdev-5.png)

      ![Local Triggerdotdev 6](./docs/images/local-development-setup/local-triggerdotdev-6.png)

      ![Local Triggerdotdev 9](./docs/images/local-development-setup/local-triggerdotdev-9.png)

      </details>

    - After the process is done, you should be able to see a new entry in `Runs` sidebar. Congrats! you have registered your local trigger.dev proxy url to github webhooks 🎉

      <details>
        <summary>
          You should see this successful run
        </summary>

      ![Local Triggerdotdev 10](./docs/images/local-development-setup/local-triggerdotdev-10.png)

      ![Local Triggerdotdev 11](./docs/images/local-development-setup/local-triggerdotdev-11.png)

      </details>

1.  **Database Connection**:
    - Use `MongoDB Compass` to connect to the database using the `MONGODB_URI` environment variable.

### Possible issues

1. Telebit can't run. You might find this issue when running `pnpm trigger-dev:proxy`.

   <details>

   ```shell
    pnpm trigger-dev:proxy

   > pr-time-tracker@0.0.3 trigger-dev:proxy /home/ubuntu/Developer/pr-time-tracker
   > ~/telebit http 3030

   /home/ubuntu/Applications/telebit/bin/telebit-remote.js:643
     var verstrd = [ pkg.name + ' daemon v' + state.config.version ];
                                                           ^

   TypeError: Cannot read property 'version' of undefined
       at handleConfig (/home/ubuntu/Applications/telebit/bin/telebit-remote.js:643:57)
       at /home/ubuntu/Applications/telebit/bin/telebit-remote.js:359:22
       at /home/ubuntu/Applications/telebit/usr/share/install-launcher.js:241:26
       at ChildProcess.exithandler (child_process.js:280:7)
       at ChildProcess.emit (events.js:182:13)
       at maybeClose (internal/child_process.js:962:16)
       at Process.ChildProcess._handle.onexit (internal/child_process.js:251:5)
    ELIFECYCLE  Command failed with exit code 1.
   ```

   Try to reinstall telebit

   ```shell
   curl https://get.telebit.io/ | bash
   ```

   Then rerun `pnpm trigger-dev:proxy`

   </details>

1. Trigger.dev local docker failed to run migration. You might face this issue when running `docker compose up` in `/container` folder.

   <details>

   ```
   triggerdotdev  | 526 migrations found in prisma/migrations
   triggerdotdev  |
   triggerdotdev  | Error: P3009
   triggerdotdev  |
   triggerdotdev  | migrate found failed migrations in the target database, new migrations will not be applied. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve
   triggerdotdev  | The `20230616104937_remove_api_identifier` migration started at 2024-11-12 08:37:52.191805 UTC failed
   triggerdotdev  |
   ```

   A fix mentioned in <https://github.com/triggerdotdev/trigger.dev/issues/1026>

   Make new Supabase project and change the `DATABASE_URL` and `DIRECT_URL` accordingly

   Add this to the `triggerdotdev` container within `docker-compose.yml`

   ```yaml
   # This is the important bit!
   command:
     - sh
     - -c
     - sed -i s/public/triggerdotdev/ ./packages/database/prisma/migrations/20240130165343_add_composite_index_to_job_run_for_job_id_and_created_at/migration.sql && ./scripts/entrypoint.sh
   ```

   </details>

1. Redis can't find addrinfo. You might face this issue when running `docker compose up` in `/container` folder.

   <details>

   ```shell
     triggerdotdev  | [ioredis] Unhandled error event: Error: getaddrinfo ENOTFOUND host.docker.internal
     triggerdotdev  |     at GetAddrInfoReqWrap.onlookup [as oncomplete] (node:dns:107:26)
     triggerdotdev  |     at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)
   ```

   </details>

   You might need to change the `REDIS_HOST="host.docker.internal"` in the `/container/.env` to docker specific ip address e.g: `REDIS_HOST=172.17.0.1`

1. After setting a development endpoint, no new `Runs` entry made.

   <details>
    Make sure the root `.env` `TRIGGER_API_KEY`, `TRIGGER_API_URL`, and `TRIGGER_PROJECT_ID` points to the correct values.

   If you have make sure of this but still no new `Runs` entry made, try to create a new project in your local trigger.dev and rerun the setup process using this new project data.
   </details>
