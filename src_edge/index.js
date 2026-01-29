'use strict';

module.exports.viewerRequest = (event, context, callback) => {
  const request = event.Records[0].cf.request;

  // Check if the request URI matches loris/iiif
  if (/loris\/iiif/.test(request.uri)) {
    request.uri = request.uri.replace(/loris\//g, '');
  }

  // Check if the request URI matches loris, loris2
  if (/loris2?\//.test(request.uri)) {
    request.uri = request.uri.replace(/loris2?\//g, 'iiif/2/');
  }

  // Check if the request URI has .jp2 extension
  if (/\.jp2/.test(request.uri)) {
    request.uri = request.uri.replace(/\.jp2/g, '');
  }
  callback(null, request);
};
