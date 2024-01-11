import { BaseCollection } from './base.collection';

import { CollectionNames, type EventsSchema } from '$lib/@types';

export class EventsCollection extends BaseCollection<EventsSchema> {}

export const events = new EventsCollection(CollectionNames.EVENTS, {
  properties: {
    action: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    title: {
      bsonType: 'string'
    },
    owner: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    sender: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    url: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    label: {
      bsonType: 'string'
    },
    index: {
      bsonType: 'int'
    },
    created_at: {
      bsonType: 'string',
      description: 'must be provided.'
    }
  }
});
