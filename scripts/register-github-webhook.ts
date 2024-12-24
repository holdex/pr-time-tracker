import { SUPPORTED_GITHUB_EVENTS } from '../src/lib/constants';
import { App } from 'octokit';

async function init() {
  const appIntegrationsListString = process.env.APP_INTEGRATIONS_LIST;
  const vercelUrl = process.env.VERCEL_URL;

  if (!appIntegrationsListString) {
    throw new Error('APP_INTEGRATIONS_LIST is not set');
  }
  if (!vercelUrl) {
    throw new Error('VERCEL_URL is not set');
  }

  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!appId || !privateKey || !webhookSecret) {
    throw new Error('GITHUB_APP_ID, GITHUB_PRIVATE_KEY, or WEBHOOK_SECRET is not set');
  }

  const githubApp = new App({
    appId,
    privateKey,
    webhooks: {
      secret: webhookSecret
    }
  });

  const appIntegrationsList = JSON.parse(appIntegrationsListString) as {
    id: string;
    name: string;
    nodeId: string;
  }[];
  if (!appIntegrationsList || appIntegrationsList.length === 0) {
    throw new Error('APP_INTEGRATIONS_LIST is empty');
  }

  const eventsList = [...SUPPORTED_GITHUB_EVENTS];

  for (const appIntegration of appIntegrationsList) {
    const { data: orgDetails } = await githubApp.octokit.rest.apps.getOrgInstallation({
      org: appIntegration.name
    });
    const octokit = await githubApp.getInstallationOctokit(orgDetails.id);

    const webhooks = await octokit.rest.orgs.listWebhooks({
      org: appIntegration.name
    });
    const existingWebhook = webhooks.data.find((w) => w.config.url === vercelUrl);

    if (existingWebhook && existingWebhook.active) {
      const missingEvents = eventsList.filter((event) => !existingWebhook.events.includes(event));
      if (missingEvents.length === 0) {
        console.log(`🔄 webhook already exists for org: ${appIntegration.name} to ${vercelUrl}`);
        continue;
      }

      const result = await octokit.rest.orgs.updateWebhook({
        org: appIntegration.name,
        hook_id: existingWebhook.id,
        events: eventsList
      });
      console.log(`🔄 webhook updated for org: ${appIntegration.name} to ${vercelUrl}`, result);
      continue;
    }

    const result = await octokit.rest.orgs.createWebhook({
      org: appIntegration.name,
      name: 'web',
      config: {
        content_type: 'json',
        url: vercelUrl,
        secret: webhookSecret
      },
      events: eventsList
    });

    console.log(`✅ webhook registered for org: ${appIntegration.name} to ${vercelUrl}`, result);
  }
}

init();
