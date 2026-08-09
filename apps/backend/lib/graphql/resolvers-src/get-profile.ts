import { Context } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';
import type { Profile } from '@cinepals/types';

interface CognitoIdentity {
  sub: string;
}

export function request(ctx: Context) {
  const { sub } = ctx.identity as unknown as CognitoIdentity;
  return ddb.get({ key: { userId: sub } });
}

export function response(ctx: Context): Profile | null {
  return ctx.result;
}
