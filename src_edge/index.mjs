import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3"

const getCached = async (bucket, key) => {
  const client = new S3Client({});
  try {
    await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key })
    );
    return true;
  } catch (_) {
    return false;
  }
};

module.exports.viewerRequest = (event, context, callback) => {
  const request = event.Records[0].cf.request;
  const cacheBucket = request.headers['iiif-cache-bucket'];
  const key = new URL(request.uri).pathname.replace(/^\//, '');
  const cached = getCached(cacheBucket, key);

  if (cached) {
    // const response = {
    //   status: 404, // Use 404 to force CloudFront to fail over to the cache
    //   isBase64Encoded: false,
    //   body: ''
    // };

    const response = {
      status: 200,
      isBase64Encoded: false,
      body: 'Item is cached'
    };

    callback(null, response);
  } else {
    // // Stash the original URI
    // request.headers["x-original-uri"] = [ { "key": "x-original-uri", "value": request.uri } ]
    // request.uri = request.uri.replace(/%/g, "%25")
    // callback(null, request);

    const response = {
      status: 200,
      isBase64Encoded: false,
      body: 'Item is NOT cached'
    };

    callback(null, response);
  }
};
