const AWS = require('aws-sdk');
const IIIF = require('iiif-processor');
const cache = require('./cache');
const helpers = require('./helpers');
const resolvers = require('./resolvers');
const errorHandler = require('./error');
const { streamifyResponse } = require('./streamify');

const density = helpers.parseDensity(process.env.density);
// Restrict width to 2000 to prevent payload limit errors. This number has shown
// in testing to fix the issues in all existing cases, while still providing a
// readable download.
const maxWidth = 2000;

const preflight = process.env.preflight === 'true';

const handleRequestFunc = streamifyResponse(async (event, context) => {
  const { eventPath, fileMissing, getRegion } = helpers;

  AWS.config.region = getRegion(context);
  context.callbackWaitsForEmptyEventLoop = false;

  let response;
  if (event.httpMethod === 'OPTIONS') {
    // OPTIONS REQUEST
    response = { statusCode: 204, body: null };
  } else if (fileMissing(event)) {
    // INFO.JSON REQUEST
    const location = eventPath(event) + '/info.json';
    response = { statusCode: 302, headers: { Location: location }, body: 'Redirecting to info.json' };
  } else {
    // IMAGE REQUEST
    response = await handleImageRequestFunc(event, context);
  }
  return helpers.addCorsHeaders(event, response);
});

const handleImageRequestFunc = async (event, context) => {
  const { getUri } = helpers;
  const { streamResolver, dimensionResolver } = resolvers.resolverFactory(event, preflight);
  const { makeCache } = cache;

  let resource;
  try {
    const uri = getUri(event);
    resource = new IIIF.Processor(uri, streamResolver, { dimensionFunction: dimensionResolver, density: density, maxWidth: maxWidth });
    const key = new URL(uri).pathname.replace(/^\//, '');
    const shouldCache = event.headers['x-cache-iiif-request'] || false;

    let response;
    const result = await resource.execute();

    if (shouldCache) {
      await makeCache(key, result);
    }

    makeResponse(result)
  } catch (err) {
    return errorHandler.errorHandler(err, event, context, resource, callback);
  }
};

const makeResponse = (result) => {
  const { isBase64 } = helpers;

  const base64 = isBase64(result);
  const content = base64 ? result.body.toString('base64') : result.body;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': result.contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 's-maxage=31536000'
    },
    isBase64Encoded: base64,
    body: content
  };
};

module.exports = {
  handler: handleRequestFunc
};
