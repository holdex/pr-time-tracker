import { logger } from '@trigger.dev/sdk/v3';

import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';
import type { IssuesLabeledEvent } from '@octokit/webhooks-types';
import type {
  AddProjectV2ItemByIdInput,
  AddProjectV2ItemByIdPayload,
  UpdateProjectV2ItemFieldValueInput,
  UpdateProjectV2ItemFieldValuePayload
} from '@octokit/graphql-schema';

import { github } from '../client';

export async function createJob(payload: IssuesLabeledEvent) {
  const { action, issue, organization } = payload;

  switch (action) {
    case 'labeled': {
      const { label } = payload;

      if (label && regexExp.test(label.name)) {
        const projectItem = await github.runTask(
          `add-issue-to-the-board-${issue.id}`,
          async (octokit) => {
            return octokit.graphql<{ addProjectV2ItemById: AddProjectV2ItemByIdPayload }>(
              `
              mutation($input: AddProjectV2ItemByIdInput!) {
                addProjectV2ItemById(input: $input) {
                  item {
                    id
                  }
                  clientMutationId
                }
              }
            `,
              {
                input: {
                  contentId: issue.node_id,
                  projectId: teamOracleNodeId
                } as AddProjectV2ItemByIdInput
              }
            );
          },
          { name: "Add Issue to the Oracle's Board" }
        );

        const updateProjectItem = await github.runTask(
          `update-project-fields-${issue.id}`,
          async (octokit) => {
            return octokit.graphql<{
              updateProjectV2ItemFieldValue: UpdateProjectV2ItemFieldValuePayload;
            }>(
              `
              mutation($input: UpdateProjectV2ItemFieldValueInput!) {
                updateProjectV2ItemFieldValue(input: $input) {
                  projectV2Item {
                    id
                  }
                }
              }
            `,
              {
                input: {
                  projectId: teamOracleNodeId,
                  itemId: projectItem.addProjectV2ItemById.item?.id,
                  fieldId: teamOracleProjectNodeId,
                  value: {
                    singleSelectOptionId: organization?.node_id
                  }
                } as UpdateProjectV2ItemFieldValueInput
              }
            );
          },
          { name: 'Update project item' }
        );
        return Promise.resolve(updateProjectItem);
      }
    }
    default: {
      logger.log('current action for issue is not in the parse candidate', payload as any);
    }
  }
}

const regexExp = new RegExp(/.*\b(goal|bug)\b/, 'i');
const teamOracleNodeId = 'PVT_kwDOAiJL_s4Ahvnc';
const teamOracleProjectNodeId = 'PVTSSF_lADOAiJL_s4AhvnczgabK1s';
