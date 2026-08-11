import { Context, util } from '@aws-appsync/utils';
import type { Profile } from '@cinepals/types';

interface CreateProfileArgs {
  displayName: string;
  bio?: string | null;
  avatar?: string | null;
}

interface CognitoIdentity {
  sub: string;
  claims: { email?: string };
}

export function request(ctx: Context<CreateProfileArgs>) {
  const { displayName, bio, avatar } = ctx.args;
  const { sub, claims } = ctx.identity as unknown as CognitoIdentity;

  return {
    operation: 'PutItem',
    key: util.dynamodb.toMapValues({ userId: sub }),
    attributeValues: util.dynamodb.toMapValues({
      displayName,
      bio: bio ?? null,
      avatar: avatar ?? null,
      email: claims.email ?? null,
      createdAt: util.time.nowISO8601(),
      // Constant partition key for the searchName-index GSI: every profile
      // shares it so name search is one indexed Query, not a table Scan.
      searchKey: 'PROFILE',
      displayNameLower: displayName.toLowerCase(),
    }),
    condition: {
      expression: 'attribute_not_exists(userId)',
    },
  };
}

export function response(ctx: Context<CreateProfileArgs>): Profile {
  if (ctx.error) {
    if (ctx.error.type === 'DynamoDB:ConditionalCheckFailedException') {
      util.error('Profile already exists for this user', 'ProfileAlreadyExists');
    }
    util.error(ctx.error.message, ctx.error.type);
  }
  const { sub } = ctx.identity as unknown as CognitoIdentity;
  return { userId: sub, friendStatus: 'NONE', ...ctx.result } as Profile;
}
