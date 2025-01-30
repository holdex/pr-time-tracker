# PR Time Tracker

PR Time Tracker is a GitHub bot that tracks core developer activity related to PRs and issues. This repository contains the user-facing part of the application. The bot's webhook handling code is located in the [pr-time-tracker-webhooks](https://github.com/holdex/pr-time-tracker-webhooks) repository.

## Contributing

If you want to contribute, please follow the Holdex [Developer Guidelines](https://github.com/holdex/developers).

## Documentation

1. Troubleshooting: [Cannot submit time](docs/cannot-submit-time/not-found.md)

## Installation

1. Visit the [PR Time Tracker App page](https://github.com/apps/pr-time-tracker) on GitHub
2. Install the app in your organization
3. Invite @pr-time-tracker to your organization and grant owner permissions
4. To manage repository access, go to "Settings" -> "GitHub Apps"

## Connecting Your Organization

To connect your organization with the Time Tracker, contact the Holdex Team to add your project's information to the [pr-time-tracker-webhooks](https://github.com/holdex/pr-time-tracker-webhooks) repository configuration:

```javascript
{
  "name": "org_slug",
  "nodeId": "oracle_project_id"
}
```

Configuration parameters:

- `name`: Your GitHub organization slug
- `nodeId`: Holdex Oracle project ID (use `337c06eb` for HX project column if no specific project is defined)

## Available Scripts

- `postinstall`: Sets up Husky for Git hooks
- `pull-env`: Pulls environment variables for development
- `dev`: Starts the development server (port 3000)
- `build`: Builds the project
- `preview`: Previews the production build
- `format`: Formats code using Prettier (with Svelte and Pug plugins)
- `lint`: Lints code using ESLint (JavaScript, TypeScript, Svelte, and CommonJS)
- `check`: Syncs SvelteKit and validates TypeScript configuration
- `type-check`: Performs TypeScript type checking
- `check:watch`: Watches for changes while checking TypeScript and syncing SvelteKit
- `proxy`: Creates an ngrok tunnel with a specific domain for development

## Local Development

### Prerequisites

1. [Git](https://git-scm.com/downloads)
2. [Node.js](https://nodejs.org/en/download/package-manager)
3. [pnpm](https://pnpm.io/installation)

### Setup Instructions

1. Clone this repository
2. Install dependencies: `pnpm install`
3. Pull environment variables: `pnpm pull-env`
4. Configure `.env` file:
   - Add `TRIGGER_SERVER_URL`: Your development/staging server URL from [pr-time-tracker-webhooks](https://github.com/holdex/pr-time-tracker-webhooks)
   - Add `TRIGGER_SERVER_SECRET`: The corresponding server secret
5. Start the proxy: `pnpm proxy` (required for GitHub login)
6. Start the development server: `pnpm dev`
