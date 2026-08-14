import * as cdk from 'aws-cdk-lib/core';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export class MediaStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Media (post images/gifs) is uploaded directly by clients via presigned
    // POST, so the bucket stays private - CloudFront (with Origin Access
    // Control) is the only public read path. Viewing goes through the
    // CloudFront domain as a plain GET (<Image src=...>), which isn't
    // CORS-gated, so only the direct-to-bucket POST upload needs a CORS rule.
    this.bucket = new s3.Bucket(this, 'MediaBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.POST],
          // TODO: narrow to the app's actual origin(s) once there's a fixed
          // web domain, instead of allowing uploads from any origin.
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.distribution = new cloudfront.Distribution(this, 'MediaDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });

    new cdk.CfnOutput(this, 'MediaCdnDomain', { value: this.distribution.distributionDomainName });
    new cdk.CfnOutput(this, 'MediaBucketName', { value: this.bucket.bucketName });
  }
}
