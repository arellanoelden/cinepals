import { generateClient, type GraphQLQuery } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Profile } from '@cinepals/types';

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
`;

const GET_PROFILE = /* GraphQL */ `
  query GetProfile {
    getProfile {
      ${PROFILE_FIELDS}
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

export async function getProfile(): Promise<Profile | null> {
  const authToken = await getIdToken();
  const result = await client.graphql<GraphQLQuery<{ getProfile: Profile | null }>>({
    query: GET_PROFILE,
    authToken,
  });
  return result.data?.getProfile ?? null;
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

export function isProfileAlreadyExistsError(error: unknown): boolean {
  const graphQLErrors = (error as { errors?: Array<{ errorType?: string }> })?.errors;
  return graphQLErrors?.some((e) => e.errorType === 'ProfileAlreadyExists') ?? false;
}
