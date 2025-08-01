const SafelistedResponseHeaders = 'cache-control,content-language,content-length,content-type,date,expires,last-modified,pragma';
const CorsDefaults = {
  AllowCredentials: 'false',
  AllowOrigin: '*',
  AllowHeaders: '*',
  ExposeHeaders: SafelistedResponseHeaders,
  MaxAge: '3600'
};

const corsSetting = (name) => {
  return process.env[`cors${name}`] || CorsDefaults[name];
};

const allowOriginValue = (corsAllowOrigin, event) => {
  if (corsAllowOrigin === 'REFLECT_ORIGIN') {
    return getHeaderValue(event, 'origin') || '*';
  }
  return corsAllowOrigin;
};

const addCorsHeaders = (event, response) => {
  response.headers = {
    ...response.headers,
    'Access-Control-Allow-Credentials': corsSetting('AllowCredentials'),
    'Access-Control-Allow-Origin': allowOriginValue(corsSetting('AllowOrigin'), event),
    'Access-Control-Allow-Headers': corsSetting('AllowHeaders'),
    'Access-Control-Expose-Headers': corsSetting('ExposeHeaders'),
    'Access-Control-Max-Age': corsSetting('MaxAge')
  };
  return response;
};

const eventPath = (event) => {
  if (event.headers["x-original-uri"]) {
    console.log(`Original URI: ${event.headers["x-original-uri"]}`)
    console.log(`Path: ${event.path}`)
    return event.headers["x-original-uri"].replace(/\/*$/, '');
  }
  return event.path.replace(/\/*$/, '');
};

const fileMissing = (event) => {
  return !/\.(jpe?g|tiff?|gif|png|webp|json)$/.test(event.path);
};

const getUri = (event) => {
  const scheme = event.headers['X-Forwarded-Proto'] || 'http';
  const host = process.env.forceHost || event.headers['X-Forwarded-Host'] || event.headers.Host;
  const uri = `${scheme}://${host}${eventPath(event)}`;
  return uri;
};

const includeStage = (event) => {
  if ('includeStage' in process.env) {
    return ['true', 'yes'].indexOf(process.env.includeStage.toLowerCase()) > -1;
  } else {
    const host = event.headers.Host;
    return host.match(/\.execute-api\.\w+?-\w+?-\d+?\.amazonaws\.com$/);
  }
};

const isBase64 = (result) => {
  return /^image\//.test(result.contentType);
};

const getRegion = (context) => {
  return context.invokedFunctionArn.match(/^arn:aws:lambda:(\w+-\w+-\d+):/)[1];
};

const parseDensity = (value) => {
  const result = Number(value);
  if (isNaN(result) || result < 0) return undefined;
  return result;
};

module.exports = {
  addCorsHeaders: addCorsHeaders,
  eventPath: eventPath,
  fileMissing: fileMissing,
  getUri: getUri,
  includeStage: includeStage,
  isBase64: isBase64,
  getRegion: getRegion,
  parseDensity: parseDensity
};
