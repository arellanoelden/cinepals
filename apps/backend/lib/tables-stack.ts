import * as cdk from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class TablesStack extends cdk.Stack {
  public readonly profilesTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Profiles table: user profile data, keyed by Cognito sub
    this.profilesTable = new dynamodb.Table(this, 'ProfilesTable', {
      tableName: 'Profiles',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Friendships table: dual-row pattern, one row per direction of the relationship
    new dynamodb.Table(this, 'FriendshipsTable', {
      tableName: 'Friendships',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'friendId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Reviews table: reviews of a media item (movie or TV show)
    const reviewsTable = new dynamodb.Table(this, 'ReviewsTable', {
      tableName: 'Reviews',
      partitionKey: { name: 'mediaId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt_userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    reviewsTable.addGlobalSecondaryIndex({
      indexName: 'userId-createdAt-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Recommendations table: media recommendations sent between friends
    const recommendationsTable = new dynamodb.Table(this, 'RecommendationsTable', {
      tableName: 'Recommendations',
      partitionKey: { name: 'recipientId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt_mediaId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    recommendationsTable.addGlobalSecondaryIndex({
      indexName: 'recommendedBy-createdAt-index',
      partitionKey: { name: 'recommendedBy', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });
  }
}
