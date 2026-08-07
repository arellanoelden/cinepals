# Description
This stack is for a movie review app called cinepals. The app revolves around doing movie reviews but tied closer to your friends. Think how letterboxd is a movie review app where you can see everyone where as this is focused on your own friend group. There is a feed of your friends most recent reviews, you can see movie details on a movie detail page that will also show reviews from your friends on this movie. Reviews can have images/gifs attached and are ranked 0 to 5. There is a standard login/sign up page where user can make an account or create one with sign in with google. For the UI we want to use react native paper and support material you. This app will be for web, android and IOS but for now lets focus on web and android. The info below is focused on the overall architecture of the app

# Movie Review Social App — Architecture Summary
## Tech Stack
- **Frontend:** Web app (React/Next.js)
- **Auth:** AWS Amplify Gen 2 + Cognito (email + Google OAuth)
- **API:** AWS AppSync (GraphQL) with direct DynamoDB resolvers (JS runtime)
- **Database:** DynamoDB
- **Storage:** S3 + CloudFront (images/gifs on posts)
- **Compute:** Lambda only where needed (presigned URLs, Bedrock, complex logic)
## Authentication
### Backend (amplify/auth/resource.ts)
- Cognito User Pool with email + Google sign-in
- Google OAuth configured via `externalProviders`
- Secrets (client ID/secret) stored in SSM Parameter Store
### Client
- `signInWithRedirect({ provider: 'Google' })` triggers OAuth flow
- Amplify library handles token storage (localStorage), refresh, and session persistence
- `fetchAuthSession()` always returns a valid token (auto-refreshes if expired)
- `getCurrentUser().userId` returns the Cognito `sub` (UUID) — use as primary key for all user-related data
- Hub listener for `signInWithRedirect` event handles post-redirect flow
### User Identity
- **Primary key:** Cognito `sub` (UUID) — immutable, stable across providers
- Available client-side via `getCurrentUser().userId`
- Available server-side from JWT claims (`event.requestContext.authorizer.claims.sub`)
---
## DynamoDB Tables
### Profiles Table
| PK | Attributes |
|----|-----------|
| userId (sub) | displayName, avatar, bio, email, createdAt |
**Access patterns:**
- Get profile: GetItem by userId
- Create on first sign-in: Post-confirmation Lambda trigger
---
### Friendships Table (dual-row pattern)
| PK (userId) | SK (friendId) | status | createdAt |
|-------------|---------------|--------|-----------|
| alice | bob | accepted | ... |
| bob | alice | accepted | ... |
**Access patterns:**
- Get all friends: Query PK=userId, FilterExpression status=accepted
- Send request: TransactWriteItems (two PutItems: outgoing_request + incoming_request)
- Accept request: TransactWriteItems (two UpdateItems → accepted)
- Get pending requests: Query PK=userId, FilterExpression status=incoming_request
**Why dual rows:** Single query returns all friends for a user. No GSI needed.
---
### Reviews Table
| PK (movieId) | SK (createdAt#userId) | userId | rating | content | media | createdAt |
|---|---|---|---|---|---|---|
| movie-123 | 2025-01-15T10:00:00Z#alice | alice | 4.5 | "Loved it" | [{key: "..."}] | ... |
**GSI: userId-createdAt-index**
- PK: userId, SK: createdAt
**Access patterns:**
| Query | Method |
|-------|--------|
| All reviews for a movie (paginated) | Query PK=movieId, ScanIndexForward=false, Limit=20 |
| Friends' reviews for a movie | BatchGetItem on (movieId, createdAt#friendId) pairs OR query movie partition + filter by friend set |
| Recent reviews by a user | Query GSI userId-createdAt-index |
| Feed (recent reviews from all friends) | Fan-out-on-read: parallel query each friend's GSI partition, merge-sort in Lambda |
---
### Recommendations Table
| PK (recipientId) | SK (createdAt#movieId) | movieId | recommendedBy | title | note | status |
|---|---|---|---|---|---|---|
| bob | 2025-01-15T10:00:00Z#movie-123 | movie-123 | alice | Inception | "You'll love this" | unseen |
**Optional GSI: recommendedBy-createdAt-index** (for "recommendations I've sent")
**Access patterns:**
| Query | Method |
|-------|--------|
| My recommendation list (newest first) | Query PK=me, ScanIndexForward=false |
| Unseen recommendations | Query PK=me, FilterExpression status=unseen |
| Recs from a specific friend | FilterExpression recommendedBy=friendId |
| Mark as watched | UpdateItem status→watched |
**Deduplication (optional):** Use movieId as SK, store recommendedBy as a set. Trade chronological sort for automatic dedup.
---
## Media (Images/GIFs on Posts)
### Upload Flow
1. Client compresses image in browser (browser-image-compression library, max 1-2MB, max 1920px)
2. Client requests presigned POST URL from AppSync mutation (Lambda resolver)
3. Lambda validates: rate limit check, storage quota
4. Returns presigned POST with `content-length-range` condition (max 2MB, must be image/*)
5. Client uploads directly to S3
6. Post record stores S3 key in media array
### Serving
- CloudFront distribution in front of S3 bucket
- Client constructs URL: `https://d1234.cloudfront.net/${post.media[0].key}`
### Protections
- **Size limit:** Presigned POST content-length-range (S3 enforces, cannot bypass)
- **Rate limit:** Lambda checks upload count per user per hour
- **Per-post limit:** Max 4 media items, validated at post creation
- **Orphan cleanup:** S3 lifecycle rule expires uploads/ prefix after 24 hours
- **Content type:** Presigned URL restricted to image/* content types
---
## AppSync Resolvers
| Operation | Resolver Type | Why |
|-----------|--------------|-----|
| Get profile | DynamoDB direct (JS) | Simple GetItem |
| Get friends | DynamoDB direct (JS) | Simple Query |
| Get reviews (by movie or user) | DynamoDB direct (JS) | Simple Query |
| Get recommendations | DynamoDB direct (JS) | Simple Query |
| Create review | DynamoDB direct (JS) | Simple PutItem |
| Send friend request | DynamoDB direct (JS) | TransactWrite |
| Send recommendation | DynamoDB direct (JS) | PutItem + optional validation |
| Generate upload URL | Lambda | Needs AWS SDK for presigned URLs |
| Feed (merge friend reviews) | Lambda | Parallel queries + merge-sort |
| Content moderation (future) | Lambda | Needs Bedrock SDK |
**Direct resolvers:** No cold starts, no Lambda runtime. Run inside AppSync's JS sandbox. Good for simple CRUD.
**Lambda resolvers:** Swap in per-field when you need libraries, SDK calls, or complex logic. Schema stays the same — client doesn't know the difference.
---
## Feed Strategy
### Starting approach: Fan-out-on-read
- Query each friend's recent reviews via GSI (parallel)
- Merge-sort results by createdAt in Lambda
- Return top N with cursor-based pagination
### Scale trigger for fan-out-on-write
Switch to a Feed table (PK=feedOwnerId, SK=createdAt) if:
- Friend counts exceed ~200
- Post frequency is high (many reviews per day per user)
- Consistent pagination becomes critical
The movie detail page (friends' reviews for a specific movie) never needs a Feed table — BatchGetItem by (movieId, friendId) stays O(friend_count) regardless of total review volume.
---
## Scaling Path


