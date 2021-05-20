# serverless-iiif

## Description

A [IIIF 2.1 Image API](https://iiif.io/api/image/2.1/) compliant server written as an [AWS Serverless Application](https://aws.amazon.com/serverless/sam/).

## Components

* A simple [Lambda Function](https://aws.amazon.com/lambda/) wrapper for the [iiif-processor](https://www.npmjs.com/package/iiif-processor) module.
* A [Lambda Layer](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html) containing all the dependencies for the Lambda Function.
* An [API Gateway](https://aws.amazon.com/api-gateway/) interface for the Lambda Function.
* A [CloudFormation](https://aws.amazon.com/cloudformation/) template describing the resources needed to deploy the application.

## Prerequisites

* Some basic knowledge of AWS.
* An Amazon Web Services account with permissions to create resources via the console and/or command line.
* An [Amazon S3](https://aws.amazon.com/s3/) bucket to hold the source images to be served via IIIF.
  **Note: The Lambda Function will be granted read access to this bucket.**

## Quick Start

`serverless-iiif` is distributed and deployed via the [AWS Serverless Application Repository](https://aws.amazon.com/serverless/serverlessrepo/). To deploy it using the AWS Console:

1. Click to 👉 [Deploy the Serverless Application](https://console.aws.amazon.com/lambda/home#/create/app?applicationId=arn:aws:serverlessrepo:us-east-1:625046682746:applications/serverless-iiif) 👈 from the AWS Console.
2. Make sure your currently selected region (in the console's top navigation bar) is the one you want to deploy to.
3. Scroll down to the **Application settings** section.
4. Give your stack a unique name, enter the name of the image bucket, and check the box acknowledging that the
   app will create an IAM execution role for itself.
5. Click **Deploy**.
6. When all the resources are properly created and configured, the new stack should be in the **CREATE_COMPLETE** stage. If there's an error, it will delete all the resources it created, roll back any changes it made, and eventually reach the **ROLLBACK_COMPLETE** stage.
7. Click the **CloudFormation stack** link.
8. Click the **Outputs** tab to see (and copy) the IIIF Endpoint URL.

## Source Images

The S3 key of any given file, minus the extension, is its IIIF ID. For example, if you want to access the image manifest for the file at `abcdef.tif`, you would get `https://.../iiif/2/abcdef/info.json`. If your key contains slashes, they must be URL-encoded: e.g., `ab/cd/ef/gh.tif` would be at `https://.../iiif/2/ab%2Fcd%2Fef%2Fgh/info.json`. (This limitation could easily be fixed by encoding only the necessary slashes in the incoming URL before handing it off to the IIIF processor, but that's beyond the scope of the demo.)

`iiif-processor` can use any image format _natively_ supported by [libvips](https://libvips.github.io/libvips/), but best results will come from using tiled, multi-resolution TIFFs. The Lambda Function wrapper included in this application assumes a `.tif` extension.

### Creating tiled TIFFs

#### Using VIPS

    vips tiffsave source_image.tif output_image.tif --tile --pyramid --compression jpeg --tile-width 256 --tile-height 256

#### Using ImageMagick

    convert source_image.tif -define tiff:tile-geometry=256x256 -compress jpeg 'ptif:output_image.tif'

## Known Limitations

AWS API Gateway Lamnbda integration has a payload (request/response body) size limit of approximately 6MB in both directions. Please see [LAMBDA_LIMIT.md](LAMBDA_LIMIT.md) for details and workarounds.

## License

This software is licensed under the [Apache License, Version 2.0](https://opensource.org/licenses/Apache-2.0). Dependencies are subject to their own licenses.

## Contributors

* [Michael B. Klein](https://github.com/mbklein)
* [Justin Gondron](https://github.com/jgondron)
* [Edward Silverton](https://github.com/edsilv)
* [Trey Pendragon](https://github.com/tpendragon)

