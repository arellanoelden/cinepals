import { Context, util } from '@aws-appsync/utils';
import type { FriendEdge } from '@cinepals/types';

interface AcceptFriendRequestArgs {
  userId: string;
}

interface CognitoIdentity {
  sub: string;
}

const TABLE_NAME = 'Friendships';

export function request(ctx: Context<AcceptFriendRequestArgs>) {
  const { sub } = ctx.identity as unknown as CognitoIdentity;
  const { userId } = ctx.args;

  if (userId === sub) {
    util.error('Cannot accept a friend request from yourself', 'InvalidFriendRequest');
  }

  const createdAt = util.time.nowISO8601();
  ctx.stash.createdAt = createdAt;
  ctx.stash.otherUserId = userId;

  const update = {
    expression: 'SET #status = :status',
    expressionNames: { '#status': 'status' },
    expressionValues: util.dynamodb.toMapValues({ ':status': 'ACCEPTED' }),
  };

  // Only the recipient of a pending request can accept it - condition-check
  // both rows so a stray/duplicate accept can't flip an already-accepted or
  // not-yet-requested relationship.
  return {
    operation: 'TransactWriteItems',
    transactItems: [
      {
        table: TABLE_NAME,
        operation: 'UpdateItem',
        key: util.dynamodb.toMapValues({ userId: sub, friendId: userId }),
        update,
        condition: {
          expression: '#status = :expected',
          expressionNames: { '#status': 'status' },
          expressionValues: util.dynamodb.toMapValues({ ':expected': 'INCOMING_REQUEST' }),
          returnValuesOnConditionCheckFailure: false,
        },
      },
      {
        table: TABLE_NAME,
        operation: 'UpdateItem',
        key: util.dynamodb.toMapValues({ userId, friendId: sub }),
        update,
        condition: {
          expression: '#status = :expected',
          expressionNames: { '#status': 'status' },
          expressionValues: util.dynamodb.toMapValues({ ':expected': 'OUTGOING_REQUEST' }),
          returnValuesOnConditionCheckFailure: false,
        },
      },
    ],
  };
}

export function response(ctx: Context<AcceptFriendRequestArgs>): FriendEdge {
  if (ctx.error) {
    if (ctx.error.type === 'DynamoDB:TransactionCanceledException') {
      util.error('No pending friend request from this user', 'FriendRequestConflict');
    }
    util.error(ctx.error.message, ctx.error.type);
  }
  // TransactWriteItems doesn't return item attributes on success, so the
  // original request's createdAt isn't available here - callers that need
  // the true value should refetch via listFriendEdges.
  return {
    userId: ctx.stash.otherUserId,
    status: 'ACCEPTED',
    createdAt: ctx.stash.createdAt,
    profile: null,
  };
}
