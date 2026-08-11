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
