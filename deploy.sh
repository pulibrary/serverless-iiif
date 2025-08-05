#!/usr/bin/env bash
if [ $1 == "production" ]
then
  sam deploy --stack-name=iiif-serverless-production \
  --s3-prefix=iiif-serverless-production \
  --parameter-overrides='StageName="production", SourceBucket="iiif-image-production", CacheDomainName="iiif-cloud.princeton.edu", CorsAllowCredentials="false", CorsAllowHeaders="*", CorsAllowOrigin="*", CorsExposeHeaders="cache-control,content-language,content-length,content-type,date,expires,last-modified,pragma", CorsMaxAge="3600", IiifLambdaMemory="3008", IiifLambdaTimeout="10", PixelDensity="0", Preflight="false", ResolverTemplate="%s.tif"' \
  --s3-bucket=aws-sam-cli-managed-default-samclisourcebucket-1j1ve93v4jqs9 \
  --region='us-east-1' \
  --capabilities='CAPABILITY_IAM' \
  --profile='figgy-deploy'
elif [ $1 == "staging" ]
then
  sam deploy --stack-name=iiif-serverless-staging \
  --s3-prefix=iiif-serverless-staging \
  --parameter-overrides='StageName="staging", SourceBucket="iiif-image-staging", CacheDomainName="iiif-cloud-staging.princeton.edu", CorsAllowCredentials="false", CorsAllowHeaders="*", CorsAllowOrigin="*", CorsExposeHeaders="cache-control,content-language,content-length,content-type,date,expires,last-modified,pragma", CorsMaxAge="3600", IiifLambdaMemory="3008", IiifLambdaTimeout="10", PixelDensity="0", Preflight="false", ResolverTemplate="%s.tif"' \
  --s3-bucket=aws-sam-cli-managed-default-samclisourcebucket-1j1ve93v4jqs9 \
  --region='us-east-1' \
  --capabilities='CAPABILITY_IAM' \
  --profile='figgy-deploy'
else
  echo 'Please enter either production or staging as the environment'
fi
