'use strict';

module.exports.viewerRequest = (event, context, callback) => {
  const request = event.Records[0].cf.request;
  const uri = request.uri;

  // Check if the request URI matches loris, loris2, or path has .jp2 extension
  if (/loris2?\//.test(uri) || /\.jp2/.test(uri)) {
    request.uri = uri.replace(/loris2?\//g, 'iiif/2/').replace(/\.jp2/g, '');
  }
  callback(null, request);
};
