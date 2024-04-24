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
  return bigquery
    .dataset(config.gcloud.dataset)
    .table(config.gcloud.table)
    .insert(
      {
        insertId: id,
        json: event
      },
      { createInsertId: true }
    )
    .catch((reason) => {
      console.log('reason', reason);
    });
}

export async function getEvents() {
  return bigquery.dataset(config.gcloud.dataset).table(config.gcloud.table).getRows();
}
