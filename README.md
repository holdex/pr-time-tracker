# PR Time Tracker

PR Time Tracker automates invoice generation processes and tracks core developer activity related to PRs.

## Installing application

1. Access the App [public page](https://github.com/apps/pr-time-tracker)
2. Install the App under your organization
3. Invite the @pr-time-tracker into your organization and make him an owner
4. To customize the included repositories go to "Settings" -> "GitHub Apps"

## Development

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
