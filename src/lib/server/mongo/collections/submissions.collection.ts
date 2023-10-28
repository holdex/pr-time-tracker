import { ObjectId, type OptionalId, type OptionalUnlessRequiredId, type WithId } from 'mongodb';

import { BaseCollection } from './base.collection';
import { items } from './items.collection';

import {
  Approval,
  CollectionNames,
  Experience,
  type ContributorSchema,
  type SubmissionSchema,
  UserRole
} from '$lib/@types';

export class SubmissionsCollection extends BaseCollection<SubmissionSchema> {
  async create({ item_id, owner_id, ...resource }: OptionalId<Omit<SubmissionSchema, 'approval'>>) {
    const item = await items.getOne({ id: item_id });

    if (!item) throw Error(`Item with ID, ${item_id}, not found. Submission declined.`);

    if (await this.getOne({ item_id, owner_id })) {
      throw Error(
        `Submission with item ID, ${item_id}, already exists for contributor, ${owner_id}.`
      );
    }

    const created_at = new Date().toISOString();
    const session = this.client.startSession();

    try {
      session.startTransaction();

      const submission = await super.create({
        item_id,
        owner_id,
        ...resource,
        approval: Approval.PENDING,
        created_at,
        updated_at: created_at
      });

      await items.update({
        id: item_id,
        submission_ids: Array.from(
          new Set((item.submission_ids || []).concat(submission._id).map(String))
        ).map((_id) => new ObjectId(_id))
      });
      session.commitTransaction();

      return submission;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    }
  }

  async update(payload: Partial<SubmissionSchema>, extra?: { user?: ContributorSchema }) {
    const { user } = extra || {};
    const prevSubmission = payload._id && (await this.getOne(payload._id.toString()));

    if (prevSubmission?.approval === Approval.APPROVED && user?.role !== UserRole.MANAGER) {
      throw Error(
        `You can no longer make any changes/updates to this submission as it has already been approved, hence, archived.`
      );
    }

    return super.update(payload, { existing: prevSubmission });
  }
}

export const submissions = new SubmissionsCollection(CollectionNames.SUBMISSIONS, {
  required: ['experience', 'hours', 'owner_id', 'item_id', 'created_at', 'updated_at', 'approval'],
  properties: {
    approval: {
      enum: Object.values(Approval),
      description: 'must be one of the enum values.'
    },
    experience: {
      bsonType: 'string',
      enum: Object.values(Experience),
      description: 'must be one of the enum values.'
    },
    hours: {
      bsonType: ['int', 'double'],
      description: 'must be provided.'
    },
    item_id: {
      bsonType: 'int',
      description: 'must be provided.'
    },
    owner_id: {
      bsonType: 'int',
      description: 'must be provided.'
    },
    rate: {
      bsonType: ['int', 'double'],
      description: 'must be provided.'
    },
    created_at: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    updated_at: {
      bsonType: 'string',
      description: 'must be provided.'
    }
  }
});
