import { Context } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';
import type { FriendRelationship, Profile } from '@cinepals/types';

interface CognitoIdentity {
  sub: string;
}

// Nested field resolver for Profile.friendStatus: looks up the caller's own
// Friendships row for this profile's owner. No row (including the caller's
// own profile, which never has a self-row) resolves to NONE.
export function request(ctx: Context) {
  const { sub } = ctx.identity as unknown as CognitoIdentity;
  const source = ctx.source as Profile;
  return ddb.get({ key: { userId: sub, friendId: source.userId } });
}

export function response(ctx: Context): FriendRelationship {
  return (ctx.result?.status as FriendRelationship | undefined) ?? 'NONE';
}
