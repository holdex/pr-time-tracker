import { IntegrationTaskKey } from '@trigger.dev/sdk';
import { Octokit } from 'octokit';

import { GitHubReturnType, GitHubRunTask, onError } from './index';
import { repoProperties } from './propertyHelpers';

export class Checks {
  constructor(private runTask: GitHubRunTask) {}

  create(
    key: IntegrationTaskKey,
    params: { name: string; owner: string; repo: string; head_sha: string }
  ): GitHubReturnType<Octokit['rest']['checks']['create']> {
    return this.runTask(
      key,
      async (client, task) => {
        const result = await client.rest.checks.create({
          owner: params.owner,
          repo: params.repo,
          name: params.name,
          head_sha: params.head_sha
        });
        return result.data;
      },
      {
        name: 'Create Check',
        params,
        properties: [
          ...repoProperties(params),
          {
            label: 'Title',
            text: params.name
          }
        ]
      },
      onError
    );
  }

  createSuite(
    key: IntegrationTaskKey,
    params: { owner: string; repo: string; head_sha: string }
  ): GitHubReturnType<Octokit['rest']['checks']['createSuite']> {
    return this.runTask(
      key,
      async (client, task) => {
        const result = await client.rest.checks.createSuite({
          owner: params.owner,
          repo: params.repo,
          head_sha: params.head_sha
        });
        return result.data;
      },
      {
        name: 'Create CheckSuite',
        params,
        properties: [...repoProperties(params)]
      },
      onError
    );
  }

  get(
    key: IntegrationTaskKey,
    params: { owner: string; repo: string; checkRunId: number }
  ): GitHubReturnType<Octokit['rest']['checks']['get']> {
    return this.runTask(
      key,
      async (client, task) => {
        const result = await client.rest.checks.get({
          owner: params.owner,
          repo: params.repo,
          check_run_id: params.checkRunId
        });
        return result.data;
      },
      {
        name: 'Get Check',
        params,
        properties: [...repoProperties(params)]
      },
      onError
    );
  }

  getSuite(
    key: IntegrationTaskKey,
    params: { owner: string; repo: string; checkSuiteId: number }
  ): GitHubReturnType<Octokit['rest']['checks']['getSuite']> {
    return this.runTask(
      key,
      async (client, task) => {
        const result = await client.rest.checks.getSuite({
          owner: params.owner,
          repo: params.repo,
          check_suite_id: params.checkSuiteId
        });
        return result.data;
      },
      {
        name: 'Get CheckSuite',
        params,
        properties: [...repoProperties(params)]
      },
      onError
    );
  }
}
