import { Context } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';
import type { Profile } from '@cinepals/types';

interface GetProfileByIdArgs {
  userId: string;
}

interface CognitoIdentity {
  sub: string;
}

export function request(ctx: Context<GetProfileByIdArgs>) {
  return ddb.get({ key: { userId: ctx.args.userId } });
}

// friendStatus is always resolved by the dedicated Profile.friendStatus
// field resolver, not by this one - the value set here is discarded by
// AppSync and only exists to satisfy the Profile type.
export function response(ctx: Context<GetProfileByIdArgs>): Profile | null {
  if (!ctx.result) {
    return null;
  }
  const { sub } = ctx.identity as unknown as CognitoIdentity;
  const isSelf = ctx.result.userId === sub;
  return { ...ctx.result, email: isSelf ? ctx.result.email : null, friendStatus: 'NONE' } as Profile;
}
