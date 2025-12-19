#!/usr/bin/env bash
if [ $1 == "iiif-cloud" ]
then
  if [ $2 == "production" ]
  then
    sam deploy --stack-name=iiif-serverless-production \
    --s3-prefix=iiif-serverless-production \
    --parameter-overrides='StageName="production", SourceBucket="iiif-image-production", CacheDomainName="iiif-cloud.princeton.edu", CorsAllowCredentials="false", CorsAllowHeaders="*", CorsAllowOrigin="*", CorsExposeHeaders="cache-control,content-language,content-length,content-type,date,expires,last-modified,pragma", CorsMaxAge="3600", IiifLambdaMemory="3008", IiifLambdaTimeout="10", PixelDensity="0", Preflight="false", ResolverTemplate="%s.tif"' \
    --s3-bucket=aws-sam-cli-managed-default-samclisourcebucket-1j1ve93v4jqs9 \
    --region='us-east-1' \
    --capabilities='CAPABILITY_IAM' \
    --profile='figgy-deploy'
  elif [ $2 == "staging" ]
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
elif [ $1 == "libimages" ]
then
  if [ $2 == "production" ]
  then
    sam deploy --stack-name=libimages-production \
    --s3-prefix=libimages-production \
    --parameter-overrides='StageName="production", SourceBucket="libimages-production", CacheDomainName="iiif.princeton.edu, "CorsAllowCredentials="false", CorsAllowHeaders="*", CorsAllowOrigin="*", CorsExposeHeaders="cache-control,content-language,content-length,content-type,date,expires,last-modified,pragma", CorsMaxAge="3600", IiifLambdaMemory="3008", IiifLambdaTimeout="10", PixelDensity="0", Preflight="false", ResolverTemplate="%s.tiff"' \
    --s3-bucket=aws-sam-cli-managed-default-samclisourcebucket-1j1ve93v4jqs9 \
    --region='us-east-1' \
    --capabilities='CAPABILITY_IAM' \
    --profile='figgy-deploy'
  elif [ $2 == "staging" ]
  then
    sam deploy --stack-name=libimages-staging \
    --s3-prefix=libimages-staging \
    --parameter-overrides='StageName="staging", SourceBucket="libimages-production", CacheDomainName="iiif-staging.princeton.edu", CorsAllowCredentials="false", CorsAllowHeaders="*", CorsAllowOrigin="*", CorsExposeHeaders="cache-control,content-language,content-length,content-type,date,expires,last-modified,pragma", CorsMaxAge="3600", IiifLambdaMemory="3008", IiifLambdaTimeout="10", PixelDensity="0", Preflight="false", ResolverTemplate="%s.tiff"' \
    --s3-bucket=aws-sam-cli-managed-default-samclisourcebucket-1j1ve93v4jqs9 \
    --region='us-east-1' \
    --capabilities='CAPABILITY_IAM' \
    --profile='figgy-deploy'
  else
    echo 'Please enter either production or staging as the environment'
  fi
else
  echo 'Please enter either iiif-cloud or libimages as the application'
fi

