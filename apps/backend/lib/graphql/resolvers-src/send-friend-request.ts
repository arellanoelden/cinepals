import { Context, util } from '@aws-appsync/utils';
import type { FriendEdge } from '@cinepals/types';

interface SendFriendRequestArgs {
  userId: string;
}

interface CognitoIdentity {
  sub: string;
}

const TABLE_NAME = 'Friendships';

export function request(ctx: Context<SendFriendRequestArgs>) {
  const { sub } = ctx.identity as unknown as CognitoIdentity;
  const { userId } = ctx.args;

  if (userId === sub) {
    util.error('Cannot send a friend request to yourself', 'InvalidFriendRequest');
  }

  const createdAt = util.time.nowISO8601();
  ctx.stash.createdAt = createdAt;
  ctx.stash.otherUserId = userId;

  // No existing relationship row on either side is required, so this fails
  // atomically if a request/friendship already exists in either direction.
  return {
    operation: 'TransactWriteItems',
    transactItems: [
      {
        table: TABLE_NAME,
        operation: 'PutItem',
        key: util.dynamodb.toMapValues({ userId: sub, friendId: userId }),
        attributeValues: util.dynamodb.toMapValues({ status: 'OUTGOING_REQUEST', createdAt }),
        condition: {
          expression: 'attribute_not_exists(userId)',
          returnValuesOnConditionCheckFailure: false,
        },
      },
      {
        table: TABLE_NAME,
        operation: 'PutItem',
        key: util.dynamodb.toMapValues({ userId, friendId: sub }),
        attributeValues: util.dynamodb.toMapValues({ status: 'INCOMING_REQUEST', createdAt }),
        condition: {
          expression: 'attribute_not_exists(userId)',
          returnValuesOnConditionCheckFailure: false,
        },
      },
    ],
  };
}

export function response(ctx: Context<SendFriendRequestArgs>): FriendEdge {
  if (ctx.error) {
    if (ctx.error.type === 'DynamoDB:TransactionCanceledException') {
      util.error('A friend request or friendship already exists with this user', 'FriendRequestConflict');
    }
    util.error(ctx.error.message, ctx.error.type);
  }
  return {
    userId: ctx.stash.otherUserId,
    status: 'OUTGOING_REQUEST',
    createdAt: ctx.stash.createdAt,
    profile: null,
  };
}
