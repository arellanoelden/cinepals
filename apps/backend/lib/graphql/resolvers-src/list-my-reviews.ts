import { Context, util } from '@aws-appsync/utils';
import type { Review } from '@cinepals/types';

interface CognitoIdentity {
  sub: string;
}

const LIST_LIMIT = 50;

export function request(ctx: Context) {
  const { sub } = ctx.identity as unknown as CognitoIdentity;
  return {
    operation: 'Query',
    index: 'userId-createdAt-index',
    query: {
      expression: 'userId = :userId',
      expressionValues: util.dynamodb.toMapValues({ ':userId': sub }),
    },
    scanIndexForward: false,
    limit: LIST_LIMIT,
  };
}

export function response(ctx: Context): Review[] {
  const items = (ctx.result.items ?? []) as Record<string, unknown>[];
  return items.map((item) => {
    const media = (item.media as { key: string }[] | undefined) ?? [];
    return {
      ...item,
      media: media.map((m) => ({ key: m.key, url: `https://${ctx.env.MEDIA_CDN_DOMAIN}/${m.key}` })),
    };
  }) as Review[];
}
