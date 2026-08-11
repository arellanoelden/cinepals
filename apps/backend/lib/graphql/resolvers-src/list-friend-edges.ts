import { Context, util } from '@aws-appsync/utils';
import type { FriendEdge } from '@cinepals/types';

interface CognitoIdentity {
  sub: string;
}

interface FriendshipRow {
  userId: string;
  friendId: string;
  status: FriendEdge['status'];
  createdAt: string;
}

export function request(ctx: Context) {
  const { sub } = ctx.identity as unknown as CognitoIdentity;
  return {
    operation: 'Query',
    query: {
      expression: 'userId = :userId',
      expressionValues: util.dynamodb.toMapValues({ ':userId': sub }),
    },
  };
}

// profile is resolved per-edge by the FriendEdge.profile field resolver.
export function response(ctx: Context): FriendEdge[] {
  const items = (ctx.result.items ?? []) as FriendshipRow[];
  return items.map((item) => ({
    userId: item.friendId,
    status: item.status,
    createdAt: item.createdAt,
    profile: null,
  }));
}
