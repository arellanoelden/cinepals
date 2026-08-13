export type FriendStatus = 'INCOMING_REQUEST' | 'OUTGOING_REQUEST' | 'ACCEPTED';

export type FriendRelationship = FriendStatus | 'NONE';

export interface Profile {
  userId: string;
  displayName: string;
  bio: string | null;
  avatar: string | null;
  email: string | null;
  createdAt: string;
  friendStatus: FriendRelationship;
}

export interface FriendEdge {
  userId: string;
  status: FriendStatus;
  createdAt: string;
  profile: Profile | null;
}

export interface MovieGenre {
  id: number;
  name: string;
}

export interface Movie {
  id: string;
  title: string;
  overview: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
  voteCount: number | null;
  runtime: number | null;
  genres: MovieGenre[] | null;
  tagline: string | null;
}
