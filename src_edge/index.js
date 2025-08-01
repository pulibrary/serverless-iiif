'use strict';

const AWS = require('aws-sdk');
const getCacheBucket = () => process.env.cacheBucket;
const getCached = (key) => {
  const s3 = new AWS.S3();
  s3.headObject({ Bucket: getCacheBucket(), Key: key }, (err) => {
    if (err) {
      return false;
    } else {
      return true;
    }
  });
};

module.exports.viewerRequest = (event, context, callback) => {
  const request = event.Records[0].cf.request;
  const key = new URL(request.uri).pathname.replace(/^\//, '');
  const cached = getCached(key);

  if (cached) {
    const response = {
      status: 404, // Use 404 to force CloudFront to fail over to the cache
      isBase64Encoded: false,
      body: ''
    };

    callback(null, response);
  } else {
    // Stash the original URI
    request.headers["x-original-uri"] = [ { "key": "x-original-uri", "value": request.uri } ]
    // The lambda will write to an S3 bucket and fall back to it if the image is
    // too big. Unfortunately the object URL for S3 replaces % with %25, so
    // fallback doesn't work. So rewrite % to %25, and then the lambda will use
    // x-original-uri, while S3 will have the right request URI.
    request.uri = request.uri.replace(/%/g, "%25")
    callback(null, request);
  }
};
