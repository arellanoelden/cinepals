import { Context, util } from '@aws-appsync/utils';

interface RemoveFriendArgs {
  userId: string;
}

interface CognitoIdentity {
  sub: string;
}

const TABLE_NAME = 'Friendships';

// Deletes both rows of a relationship, whatever its current status - this
// single mutation covers declining an incoming request, cancelling an
// outgoing one, and unfriending an accepted friend. DeleteItem on a missing
// item is a no-op, so this is safely idempotent.
export function request(ctx: Context<RemoveFriendArgs>) {
  const { sub } = ctx.identity as unknown as CognitoIdentity;
  const { userId } = ctx.args;

  if (userId === sub) {
    util.error('Cannot remove yourself as a friend', 'InvalidFriendRequest');
  }

  return {
    operation: 'TransactWriteItems',
    transactItems: [
      {
        table: TABLE_NAME,
        operation: 'DeleteItem',
        key: util.dynamodb.toMapValues({ userId: sub, friendId: userId }),
      },
      {
        table: TABLE_NAME,
        operation: 'DeleteItem',
        key: util.dynamodb.toMapValues({ userId, friendId: sub }),
      },
    ],
  };
}

export function response(ctx: Context<RemoveFriendArgs>): boolean {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return true;
}
