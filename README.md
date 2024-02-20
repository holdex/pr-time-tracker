AutoInvoice

This is the autoinvoice package version 0.0.1.

Description
AutoInvoice is a private package aimed at automating invoice generation processes. It includes scripts for development, building, formatting, linting, and checking the codebase.

Scripts
postinstall: Sets up Husky for Git hooks.
pre-dev: Executes a script to pull environment variables before starting development.
dev: Starts the development server on port 3000 after executing pre-dev script.
build: Builds the project.
preview: Previews the build.
format: Formats the code using Prettier with plugins for Svelte and Pug.
lint: Lints the codebase using ESLint with support for JavaScript, TypeScript, Svelte, and CommonJS.
check: Syncs Svelte kit and checks the TypeScript configuration.
type-check: type checks the TypeScript files without emitting any output.
check:watch: Watches for changes and syncs Svelte kit while checking TypeScript.
proxy: Sets up ngrok to proxy requests to the development server with a specific domain.

This package is intended for internal use only and is not meant for public distribution.
