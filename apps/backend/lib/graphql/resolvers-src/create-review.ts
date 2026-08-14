import { Context, util } from '@aws-appsync/utils';
import type { Review } from '@cinepals/types';

interface CreateReviewArgs {
  mediaId: string;
  rating: number;
  content?: string | null;
  mediaKeys?: string[] | null;
}

interface CognitoIdentity {
  sub: string;
}

const MIN_RATING = 0;
const MAX_RATING = 5;
const MAX_MEDIA_ITEMS = 4;

export function request(ctx: Context<CreateReviewArgs>) {
  const { mediaId, rating, content, mediaKeys } = ctx.args;
  const { sub } = ctx.identity as unknown as CognitoIdentity;

  if (rating < MIN_RATING || rating > MAX_RATING) {
    util.error('Rating must be between 0 and 5', 'InvalidRating');
  }
  if ((mediaKeys?.length ?? 0) > MAX_MEDIA_ITEMS) {
    util.error(`A post can have at most ${MAX_MEDIA_ITEMS} media items`, 'TooManyMediaItems');
  }

  const createdAt = util.time.nowISO8601();

  return {
    operation: 'PutItem',
    key: util.dynamodb.toMapValues({ mediaId, createdAt_userId: `${createdAt}#${sub}` }),
    attributeValues: util.dynamodb.toMapValues({
      mediaId,
      userId: sub,
      createdAt,
      rating,
      content: content ?? null,
      media: (mediaKeys ?? []).map((key) => ({ key })),
    }),
  };
}

export function response(ctx: Context<CreateReviewArgs>): Review {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  const result = ctx.result as Record<string, unknown>;
  const media = (result.media as { key: string }[] | undefined) ?? [];
  return {
    ...result,
    media: media.map((item) => ({ key: item.key, url: `https://${ctx.env.MEDIA_CDN_DOMAIN}/${item.key}` })),
  } as Review;
}
