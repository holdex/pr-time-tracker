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
  const { dataset, table, projectId } = config.gcloud;

  // Use MERGE to prevent duplicate inserts (idempotent operation)
  // This ensures events with the same _id are not duplicated
  const query = `
    MERGE \`${projectId}.${dataset}.${table}\` AS target
    USING (SELECT @id AS _id) AS source
    ON target._id = source._id
    WHEN NOT MATCHED THEN
      INSERT (_id, id, organization, repository, action, title, owner, sender, label, payload, \`index\`, created_at, updated_at)
      VALUES (@id, @eventId, @organization, @repository, @action, @title, @owner, @sender, @label, @payload, @index, @created_at, @updated_at)
  `;

  const options = {
    query,
    params: {
      ...event,
      id,
      eventId: event.id,
      label: event.label ?? null,
      payload: event.payload ?? null,
      created_at: event.created_at?.toString() ?? null,
      updated_at: event.updated_at?.toString() ?? null
    },
    // BigQuery requires explicit types for null parameter values
    types: {
      id: 'STRING',
      eventId: 'INT64',
      organization: 'STRING',
      repository: 'STRING',
      action: 'STRING',
      title: 'STRING',
      owner: 'STRING',
      sender: 'STRING',
      label: 'STRING',
      payload: 'FLOAT64',
      index: 'INT64',
      created_at: 'STRING',
      updated_at: 'STRING'
    }
  };

  try {
    const [job] = await bigquery.createQueryJob(options);
    await job.getQueryResults();
  } catch (reason) {
    console.error('BigQuery insert error:', (reason as Error).message);
    console.error('Error details:', JSON.stringify((reason as { errors?: unknown }).errors));
  }
}

export async function getEvents() {
  return bigquery.dataset(config.gcloud.dataset).table(config.gcloud.table).getRows();
}
