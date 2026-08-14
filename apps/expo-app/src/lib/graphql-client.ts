import { generateClient, type GraphQLQuery } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Platform } from 'react-native';
import type { FriendEdge, Movie, Profile, Review, UploadTarget } from '@cinepals/types';

const client = generateClient();

// The default access token AppSync gets for 'userPool' auth has no `email`
// claim (only ID tokens carry attribute claims), so these calls pass the ID
// token explicitly - the resolvers read the user's email from it.
async function getIdToken(): Promise<string> {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.toString();
  if (!idToken) {
    throw new Error('No authenticated session');
  }
  return idToken;
}

const PROFILE_FIELDS = `
  userId
  displayName
  bio
  avatar
  email
  createdAt
  friendStatus
`;

const FRIEND_EDGE_FIELDS = `
  userId
  status
  createdAt
  profile {
    ${PROFILE_FIELDS}
  }
`;

const GET_PROFILE = /* GraphQL */ `
  query GetProfile {
    getProfile {
      ${PROFILE_FIELDS}
    }
  }
`;

const GET_PROFILE_BY_ID = /* GraphQL */ `
  query GetProfileById($userId: ID!) {
    getProfileById(userId: $userId) {
      ${PROFILE_FIELDS}
    }
  }
`;

const SEARCH_PROFILES = /* GraphQL */ `
  query SearchProfiles($query: String!) {
    searchProfiles(query: $query) {
      ${PROFILE_FIELDS}
    }
  }
`;

const LIST_FRIEND_EDGES = /* GraphQL */ `
  query ListFriendEdges {
    listFriendEdges {
      ${FRIEND_EDGE_FIELDS}
    }
  }
`;

const MOVIE_FIELDS = `
  id
  title
  overview
  posterPath
  backdropPath
  releaseDate
  voteAverage
  voteCount
  runtime
  tagline
  genres {
    id
    name
  }
`;

const SEARCH_MOVIES = /* GraphQL */ `
  query SearchMovies($query: String!) {
    searchMovies(query: $query) {
      ${MOVIE_FIELDS}
    }
  }
`;

const GET_MOVIE = /* GraphQL */ `
  query GetMovie($id: ID!) {
    getMovie(id: $id) {
      ${MOVIE_FIELDS}
    }
  }
`;

const REVIEW_FIELDS = `
  mediaId
  userId
  createdAt
  rating
  content
  media {
    key
    url
  }
  movie {
    ${MOVIE_FIELDS}
  }
`;

const MY_REVIEWS = /* GraphQL */ `
  query MyReviews {
    myReviews {
      ${REVIEW_FIELDS}
    }
  }
`;

const CREATE_REVIEW = /* GraphQL */ `
  mutation CreateReview($mediaId: ID!, $rating: Float!, $content: String, $mediaKeys: [String!]) {
    createReview(mediaId: $mediaId, rating: $rating, content: $content, mediaKeys: $mediaKeys) {
      ${REVIEW_FIELDS}
    }
  }
`;

const GENERATE_UPLOAD_URL = /* GraphQL */ `
  mutation GenerateUploadUrl($contentType: String!, $fileExtension: String!) {
    generateUploadUrl(contentType: $contentType, fileExtension: $fileExtension) {
      url
      key
      fields
    }
  }
`;

const CREATE_PROFILE = /* GraphQL */ `
  mutation CreateProfile($displayName: String!, $bio: String, $avatar: String) {
    createProfile(displayName: $displayName, bio: $bio, avatar: $avatar) {
      ${PROFILE_FIELDS}
    }
  }
`;

const SEND_FRIEND_REQUEST = /* GraphQL */ `
  mutation SendFriendRequest($userId: ID!) {
    sendFriendRequest(userId: $userId) {
      ${FRIEND_EDGE_FIELDS}
    }
  }
`;

const ACCEPT_FRIEND_REQUEST = /* GraphQL */ `
  mutation AcceptFriendRequest($userId: ID!) {
    acceptFriendRequest(userId: $userId) {
      ${FRIEND_EDGE_FIELDS}
    }
  }
`;

const REMOVE_FRIEND = /* GraphQL */ `
  mutation RemoveFriend($userId: ID!) {
    removeFriend(userId: $userId)
  }
`;

export async function getProfile(): Promise<Profile | null> {
  const authToken = await getIdToken();
  const result = await client.graphql<GraphQLQuery<{ getProfile: Profile | null }>>({
    query: GET_PROFILE,
    authToken,
  });
  return result.data?.getProfile ?? null;
}

export async function getProfileById(userId: string): Promise<Profile | null> {
  const authToken = await getIdToken();
  const result = await client.graphql<GraphQLQuery<{ getProfileById: Profile | null }>>({
    query: GET_PROFILE_BY_ID,
    variables: { userId },
    authToken,
  });
  return result.data?.getProfileById ?? null;
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  const authToken = await getIdToken();
  const result = await client.graphql<GraphQLQuery<{ searchProfiles: Profile[] }>>({
    query: SEARCH_PROFILES,
    variables: { query },
    authToken,
  });
  return result.data?.searchProfiles ?? [];
}

export async function listFriendEdges(): Promise<FriendEdge[]> {
  const authToken = await getIdToken();
  const result = await client.graphql<GraphQLQuery<{ listFriendEdges: FriendEdge[] }>>({
    query: LIST_FRIEND_EDGES,
    authToken,
  });
  return result.data?.listFriendEdges ?? [];
}

export interface CreateProfileInput {
  displayName: string;
  bio?: string;
  avatar?: string;
}

export async function createProfile(input: CreateProfileInput): Promise<Profile> {
  const authToken = await getIdToken();
  const result = await client.graphql<GraphQLQuery<{ createProfile: Profile }>>({
    query: CREATE_PROFILE,
    variables: input,
    authToken,
  });
  return result.data!.createProfile;
}

export async function sendFriendRequest(userId: string): Promise<FriendEdge> {
  const authToken = await getIdToken();
  const result = await client.graphql<GraphQLQuery<{ sendFriendRequest: FriendEdge }>>({
    query: SEND_FRIEND_REQUEST,
    variables: { userId },
    authToken,
  });
  return result.data!.sendFriendRequest;
}

export async function acceptFriendRequest(userId: string): Promise<FriendEdge> {
  const authToken = await getIdToken();
  const result = await client.graphql<GraphQLQuery<{ acceptFriendRequest: FriendEdge }>>({
    query: ACCEPT_FRIEND_REQUEST,
    variables: { userId },
    authToken,
  });
  return result.data!.acceptFriendRequest;
}

export async function removeFriend(userId: string): Promise<boolean> {
  const authToken = await getIdToken();
  const result = await client.graphql<GraphQLQuery<{ removeFriend: boolean }>>({
    query: REMOVE_FRIEND,
    variables: { userId },
    authToken,
  });
  return result.data?.removeFriend ?? false;
}

export async function searchMovies(query: string): Promise<Movie[]> {
  const authToken = await getIdToken();
  const result = await client.graphql<GraphQLQuery<{ searchMovies: Movie[] }>>({
    query: SEARCH_MOVIES,
    variables: { query },
    authToken,
  });
  return result.data?.searchMovies ?? [];
}

export async function getMovie(id: string): Promise<Movie | null> {
  const authToken = await getIdToken();
  const result = await client.graphql<GraphQLQuery<{ getMovie: Movie | null }>>({
    query: GET_MOVIE,
    variables: { id },
    authToken,
  });
  return result.data?.getMovie ?? null;
}

export async function myReviews(): Promise<Review[]> {
  const authToken = await getIdToken();
  const result = await client.graphql<GraphQLQuery<{ myReviews: Review[] }>>({
    query: MY_REVIEWS,
    authToken,
  });
  return result.data?.myReviews ?? [];
}

export interface CreateReviewInput {
  mediaId: string;
  rating: number;
  content?: string;
  mediaKeys?: string[];
}

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const authToken = await getIdToken();
  const result = await client.graphql<GraphQLQuery<{ createReview: Review }>>({
    query: CREATE_REVIEW,
    variables: input,
    authToken,
  });
  return result.data!.createReview;
}

export async function generateUploadUrl(contentType: string, fileExtension: string): Promise<UploadTarget> {
  const authToken = await getIdToken();
  const result = await client.graphql<
    GraphQLQuery<{ generateUploadUrl: { url: string; key: string; fields: string } }>
  >({
    query: GENERATE_UPLOAD_URL,
    variables: { contentType, fileExtension },
    authToken,
  });
  const raw = result.data!.generateUploadUrl;
  return { url: raw.url, key: raw.key, fields: JSON.parse(raw.fields) };
}

// S3 presigned POST: every field from the presign (policy, signature, key,
// Content-Type, ...) must be appended before the file, or S3 rejects the
// upload. On native, React Native's FormData/fetch doesn't serialize a Blob
// from fetch(uri).blob() into a real multipart file part - it needs the
// {uri, name, type} descriptor shape so the native networking layer streams
// the file directly from disk. Sending a Blob there confuses S3's multipart
// parser into miscounting the file bytes as oversized form fields
// (MaxPostPreDataLengthExceeded) instead of a file. Web has no such
// descriptor shape, so it needs an actual Blob.
export async function uploadMediaAsset(
  localUri: string,
  contentType: string,
  uploadTarget: UploadTarget,
): Promise<void> {
  const filename = uploadTarget.key.split('/').pop() ?? 'upload';
  const formData = new FormData();
  for (const [key, value] of Object.entries(uploadTarget.fields)) {
    formData.append(key, value);
  }

  if (Platform.OS === 'web') {
    const blob = await (await fetch(localUri)).blob();
    formData.append('file', blob, filename);
  } else {
    formData.append('file', { uri: localUri, name: filename, type: contentType } as unknown as Blob);
  }

  const response = await fetch(uploadTarget.url, { method: 'POST', body: formData });
  if (!response.ok) {
    throw new Error(`Media upload failed with status ${response.status}`);
  }
}

export function isProfileAlreadyExistsError(error: unknown): boolean {
  const graphQLErrors = (error as { errors?: { errorType?: string }[] })?.errors;
  return graphQLErrors?.some((e) => e.errorType === 'ProfileAlreadyExists') ?? false;
}

export function isFriendRequestConflictError(error: unknown): boolean {
  const graphQLErrors = (error as { errors?: { errorType?: string }[] })?.errors;
  return graphQLErrors?.some((e) => e.errorType === 'FriendRequestConflict') ?? false;
}
