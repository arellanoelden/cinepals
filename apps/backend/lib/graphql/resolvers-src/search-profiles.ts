import { Context, util } from '@aws-appsync/utils';
import type { Profile } from '@cinepals/types';

interface SearchProfilesArgs {
  query: string;
}

interface CognitoIdentity {
  sub: string;
}

const SEARCH_LIMIT = 20;

export function request(ctx: Context<SearchProfilesArgs>) {
  return {
    operation: 'Query',
    index: 'searchName-index',
    query: {
      expression: 'searchKey = :searchKey AND begins_with(displayNameLower, :prefix)',
      expressionValues: util.dynamodb.toMapValues({
        ':searchKey': 'PROFILE',
        ':prefix': ctx.args.query.toLowerCase(),
      }),
    },
    limit: SEARCH_LIMIT,
  };
}

// friendStatus is resolved per-item by the Profile.friendStatus field
// resolver; the value set here is discarded and only satisfies the type.
export function response(ctx: Context<SearchProfilesArgs>): Profile[] {
  const { sub } = ctx.identity as unknown as CognitoIdentity;
  return (ctx.result.items ?? []).map((item: Record<string, unknown>) => ({
    ...item,
    email: item.userId === sub ? item.email : null,
    friendStatus: 'NONE',
  })) as Profile[];
}
