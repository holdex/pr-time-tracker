# PR Time Tracker

PR Time Tracker is a GitHub bot that tracks core developer activity related to PRs and issues. This repository contains the user-facing part of the application. The bot's webhook handling code is located in the [pr-time-tracker-webhooks](https://github.com/holdex/pr-time-tracker-webhooks) repository.

## Contributing

If you want to contribute, please follow the Holdex [Developer Guidelines](https://github.com/holdex/developers).

## User Guide

### Installation

1. Visit the [PR Time Tracker App page](https://github.com/apps/pr-time-tracker) on GitHub
2. Install the app in your organization
3. Invite @pr-time-tracker to your organization and grant owner permissions
4. To manage repository access, go to "Settings" -> "GitHub Apps"

> **Important**: pr-time-tracker requires installation in a GitHub organization account to function properly. If installed in a personal account, the app will not process any data. Please ensure you install it in your organization instead.

#### Optional: Holdex Board Integration

To have your organization's issues tagged in the Holdex Project tracker:

1. Add your organization slug to the [pr-time-tracker-webhooks](https://github.com/holdex/pr-time-tracker-webhooks) repository configuration
2. If you don't have repository access, contact the Holdex Team for assistance

### Tracking PR Time

Steps:

1. Mark the PR as Ready for review (not Draft).
2. Assign at least one reviewer.

Result:

- A PR time submission notice appears shortly after for the PR author.
- Reviewers are added to the notice after they submit a review.

### Tracking Bugs

Steps:

1. Ensure the PR title starts with `fix:` (optionally with a scope like `fix(ui):`).
2. Mark the PR as Ready for review (not Draft).

Result:

- A bug submission notice appears shortly after.

Notes:

- Draft PRs do not trigger notices.

## Development Setup

- 💻 [Developer Documentation](./DEVELOPERS.md)
