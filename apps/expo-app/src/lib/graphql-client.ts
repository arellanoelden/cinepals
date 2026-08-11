import { generateClient, type GraphQLQuery } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { FriendEdge, Profile } from '@cinepals/types';

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

export function isProfileAlreadyExistsError(error: unknown): boolean {
  const graphQLErrors = (error as { errors?: { errorType?: string }[] })?.errors;
  return graphQLErrors?.some((e) => e.errorType === 'ProfileAlreadyExists') ?? false;
}

export function isFriendRequestConflictError(error: unknown): boolean {
  const graphQLErrors = (error as { errors?: { errorType?: string }[] })?.errors;
  return graphQLErrors?.some((e) => e.errorType === 'FriendRequestConflict') ?? false;
}
