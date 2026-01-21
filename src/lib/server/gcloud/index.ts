import { BigQuery } from '@google-cloud/bigquery';

import type { EventsSchema } from '$lib/@types';

import config from '../config';

const bigquery = new BigQuery({
  credentials: {
    client_email: config.gcloud.clientEmail,
    private_key: config.gcloud.privateKey,
    project_id: config.gcloud.projectId
  }
});

export async function insertEvent(event: EventsSchema, id: string) {
  const { dataset } = config.gcloud;
  const { table } = config.gcloud;

  // Use MERGE to prevent duplicate inserts (idempotent operation)
  // This ensures events with the same _id are not duplicated
  const query = `
    MERGE \`${config.gcloud.projectId}.${dataset}.${table}\` AS target
    USING (SELECT @id AS _id) AS source
    ON target._id = source._id
    WHEN NOT MATCHED THEN
      INSERT (_id, id, organization, repository, action, title, owner, sender, label, payload, \`index\`, created_at, updated_at)
      VALUES (@id, @eventId, @organization, @repository, @action, @title, @owner, @sender, @label, @payload, @index, @created_at, @updated_at)
  `;

  const options = {
    query,
    params: {
      id,
      eventId: event.id,
      organization: event.organization,
      repository: event.repository,
      action: event.action,
      title: event.title,
      owner: event.owner,
      sender: event.sender,
      label: event.label || null,
      payload: event.payload || null,
      index: event.index,
      created_at: event.created_at?.toString() || null,
      updated_at: event.updated_at?.toString() || null
    }
  };

  const [job] = await bigquery.createQueryJob(options);
  await job.getQueryResults();
}

export async function getEvents() {
  return bigquery.dataset(config.gcloud.dataset).table(config.gcloud.table).getRows();
}
