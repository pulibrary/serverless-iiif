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

const isBase64 = (result) => {
  return /^image\//.test(result.contentType);
};

const isTooLarge = (content) => {
  const payloadLimit = (6 * 1024 * 1024) / 1.4;
  return content.length > payloadLimit;
};

const forceCache = (event) => {
  return event.headers['x-cache-iiif-request'] || false;
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
  eventPath: eventPath,
  fileMissing: fileMissing,
  getUri: getUri,
  isBase64: isBase64,
  isTooLarge: isTooLarge,
  forceCache: forceCache,
  getRegion: getRegion,
  parseDensity: parseDensity
};
