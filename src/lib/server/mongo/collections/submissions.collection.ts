import { Approval, CollectionNames, Experience, type SubmissionSchema } from '../types';
import { BaseCollection } from './base.collection';

export class SubmissionsCollection extends BaseCollection<SubmissionSchema> {}

export const submissions = new SubmissionsCollection(CollectionNames.SUBMISSIONS, {
  required: ['experience', 'hours', 'owner', 'item_id'],
  properties: {
    approval: {
      bsonType: ['string', 'null'],
      enum: Object.values(Approval),
      description: 'must be one of the enum values.'
    },
    experience: {
      bsonType: 'string',
      enum: Object.values(Experience),
      description: 'must be one of the enum values.'
    },
    hours: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    item_id: {
      bsonType: 'objectId',
      description: 'must be provided.'
    },
    owner: {
      bsonType: 'string',
      description: 'must be provided.'
    }
  }
});
