const { S3Client, PutObjectCommand, S3ServiceException } = require('@aws-sdk/client-s3');

const cacheConfigured = () => {
  return (typeof process.env.cacheBucket === 'string') && process.env.cacheBucket.length > 0;
};
const getCacheBucket = () => process.env.cacheBucket;

const makeCache = async (key, image) => {
  const cacheBucket = getCacheBucket();
    const client = new S3Client({});
    const command = new PutObjectCommand({
      Bucket: cacheBucket,
      Key: key,
      Body: image.body,
      ContentType: image.contentType
    });

    try {
      await client.send(command);
    } catch(caught) {
      console.log(`Error caching image: ${caught.name}: ${caught.message}`);
    }
};

module.exports = {
  makeCache
};
