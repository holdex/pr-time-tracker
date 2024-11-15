import { BaseCollection } from './base.collection';
import { items } from './items.collection';
import { contributors } from './contributors.collection';

import { CollectionNames, type SubmissionSchema, type BugReportSchema } from '$lib/@types';

export class BugReportCollection extends BaseCollection<BugReportSchema> {
  async create({
    item_id,
    bug_author_username,
    commit_link,
    reporter_id,
    reporter_username
  }: Omit<BugReportSchema, 'bug_author_id'>) {
    const item = await items.getOne({ id: item_id });

    if (!item) throw Error(`Item with ID, ${item_id}, not found. Bug report declined.`);

    if (await this.getOne({ item_id })) {
      throw Error(`Bug report with item ID, ${item_id}, already exists.`);
    }

    const created_at = new Date().toISOString();
    const session = this.client.startSession();

    const bugOwner = await contributors.getOne({ login: bug_author_username });

    try {
      session.startTransaction();

      const bugReport = await super.create({
        item_id,
        bug_author_username: bug_author_username,
        bug_author_id: bugOwner?.id,
        commit_link,
        reporter_id,
        reporter_username,
        created_at,
        updated_at: created_at
      });

      session.commitTransaction();

      return bugReport;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    }
  }

  async update(payload: Partial<SubmissionSchema>) {
    const prevSubmission = payload._id && (await this.getOne(payload._id.toString()));

    return super.update(payload, { existing: prevSubmission });
  }
}

export const bugReports = new BugReportCollection(CollectionNames.BUG_REPORTS, {
  required: [
    'bug_author_id',
    'commit_link',
    'reporter_id',
    'reporter_username',
    'item_id',
    'created_at',
    'updated_at'
  ],
  properties: {
    bug_author_id: {
      bsonType: ['int', 'double', 'undefined'],
      description: 'must be number or undefined.'
    },
    bug_author_username: {
      bsonType: ['int', 'double'],
      description: 'must be provided.'
    },
    reporter_id: {
      bsonType: ['int', 'double'],
      description: 'must be provided.'
    },
    reporter_username: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    commit_link: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    item_id: {
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
