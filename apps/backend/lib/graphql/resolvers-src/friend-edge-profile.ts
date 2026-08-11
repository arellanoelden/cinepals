import { Context } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';
import type { FriendEdge, Profile } from '@cinepals/types';

interface CognitoIdentity {
  sub: string;
}

// Nested field resolver for FriendEdge.profile: hydrates the other person's
// display info for a row in listFriendEdges. FriendEdge.userId is always
// "the other person" (see list-friend-edges.ts), so this is a plain GetItem
// keyed by that id.
export function request(ctx: Context) {
  const source = ctx.source as FriendEdge;
  return ddb.get({ key: { userId: source.userId } });
}

// friendStatus is resolved separately by the Profile.friendStatus field
// resolver once this object is returned - the value set here is discarded
// and only exists to satisfy the Profile type.
export function response(ctx: Context): Profile | null {
  if (!ctx.result) {
    return null;
  }
  const { sub } = ctx.identity as unknown as CognitoIdentity;
  const isSelf = ctx.result.userId === sub;
  return { ...ctx.result, email: isSelf ? ctx.result.email : null, friendStatus: 'NONE' } as Profile;
}
