# AutoInvoice

AutoInvoice automates invoice generation processes and tracks core developer activity related to PRs.

## Installing application
1. Go to GitHub organisation where you would like to install the app.
2. Go to "Settings" -> "GitHub Apps"

## Development 

- postinstall: Sets up Husky for Git hooks.
- pre-dev: Executes a script to pull environment variables before starting development.
- dev: Starts the development server on port 3000 after executing pre-dev script.
- build: Builds the project.
- preview: Previews the build.
- format: Formats the code using Prettier with plugins for Svelte and Pug.
- lint: Lints the codebase using ESLint with support for JavaScript, TypeScript, Svelte, and CommonJS.
 check: Syncs Svelte kit and checks the TypeScript configuration.
- type-check: type checks the TypeScript files without emitting any output.
- check:watch: Watches for changes and syncs Svelte kit while checking TypeScript.
- proxy: Sets up ngrok to proxy requests to the development server with a specific domain.

