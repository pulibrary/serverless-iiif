/*
 * IMPLEMENTATION NOTE: API Gateway Lambda functions have a
 * ~6MB payload limit. See LAMBDA_LIMIT.md for implications
 * and a workaround.
 */

const AWS = require('aws-sdk');
const IIIF = require('iiif-processor');
const middy = require('middy');
const { cors, httpHeaderNormalizer } = require('middy/middlewares');
// Restrict width to 2000 to prevent payload limit errors. This number has shown
// in testing to fix the issues in all existing cases, while still providing a
// readable download.
const maxWidth = 2000;

const handleRequest = (event, context, callback) => {
  try {
    context.callbackWaitsForEmptyEventLoop = false;
    new IIIFLambda(event, context, callback, process.env.tiffBucket)
      .processRequest();
  } catch (err) {
    callback(err, null);
  }
};

class IIIFLambda {
  constructor (event, context, callback, sourceBucket) {
    this.event = event;
    this.context = context;
    this.respond = callback;
    this.sourceBucket = sourceBucket;
    this.handled = false;
    // console.log("IIIFLambda.constructor called with sourceBucket", sourceBucket)
  }

  directResponse (result) {
    var base64 = /^image\//.test(result.contentType);
    var content = base64 ? result.body.toString('base64') : result.body;
    var response = {
      statusCode: 200,
      headers: {
        'Content-Type': result.contentType,
        'Access-Control-Allow-Origin': '*'
       },
      isBase64Encoded: base64,
      body: content
    };
    if (content.length > 6 * 1024 * 1024) {
        var scheme = this.event.headers['X-Forwarded-Proto'] || 'http';
        var host = this.event.headers['Host'];
        var uri = `${scheme}://${host}${this.eventPath()}`;
        console.log("base64.length = ", content.length, "original.length = ", result.body.length)
        throw Error ('Content size (' + content.length.toString() + ') exceeds API gateway maximum when calling ' + uri)
    } else {
        this.respond(null, response);
    }
  }

  handleError (err, _resource) {
    console.error(err)
    console.log("this.event = ", this.event)
    console.log("this.context = ", this.context)
    if (err.statusCode) {
      this.respond(null, {
        statusCode: err.statusCode,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Not Found'
      });
    } else if (err instanceof this.resource.errorClass) {
      this.respond(null, {
        statusCode: 400,
        headers: { 'Content-Type': 'text/plain' },
        body: err.toString()
      });
    } else {
      this.respond(err, null);
    }
  }

  includeStage() {
    if ('include_stage' in process.env) {
      return ['true', 'yes'].indexOf(process.env.include_stage.toLowerCase()) > -1;
    } else {
      var host = this.event.headers['X-Forwarded-Host'] || this.event.headers['Host'];
      return host.match(/\.execute-api\.\w+?-\w+?-\d+?\.amazonaws\.com$/);
    }
  }

  fileMissing() {
    return !/\.(jpg|tif|gif|png|json)$/.test(this.event.path);
  }

  eventPath() {
    if ('storedEventPath' in this) return this.storedEventPath;

    var path = this.event.path;
    if (this.includeStage()) {
      path = '/' + this.event.requestContext.stage + path;
    }
    this.storedEventPath = path.replace(/\/*$/, '');
    return this.storedEventPath;
  }

  checkForOptionsRequest() {
    if (this.handled) return this;
    if (this.event.httpMethod === 'OPTIONS') {
      this.respond(null, { statusCode: 204, body: null });
      this.handled = true;
    }
    return this;
  }

  checkForInfoJsonRedirect() {
    if (this.handled) return this;
    if (this.fileMissing()) {
      console.log("file is missing, redirect to info.json")
      var location = this.eventPath() + '/info.json';
      this.respond(null, { statusCode: 302, headers: { 'Location': location }, body: "Redirecting to info.json" });
      this.handled = true;
    }
    return this;
  }

  execute() {
    if (this.handled) return this;

    var scheme = this.event.headers['X-Forwarded-Proto'] || 'http';
    var host = this.event.headers['X-Forwarded-Host'] || this.event.headers['Host'];
    var uri = `${scheme}://${host}${this.eventPath()}`;

    console.log("iiif image uri = ", uri)
    this.resource = new IIIF.Processor(uri, id => this.s3Object(id));

    this.resource
      .execute()
      .then(result => this.directResponse(result))
      .catch(err => this.handleError(err));

    this.handled = true;
    return this;
  }

  processRequest () {
    AWS.config.region = this.context.invokedFunctionArn.match(/^arn:aws:lambda:(\w+-\w+-\d+):/)[1];

    this
      .checkForOptionsRequest()
      .checkForInfoJsonRedirect()
      .execute()
  }

  async dimensions (id, bucket) {
    var s3 = new AWS.S3();
    const obj = await s3.headObject({
      Bucket: bucket,
      Key: `${id}.tif`
    }).promise()
    if (obj.Metadata.width && obj.Metadata.height) {
      return {
        width: parseInt(obj.Metadata.width, 10),
        height: parseInt(obj.Metadata.height, 10)
      }
    }
    return null;
  }

  s3Object (id) {
    var s3 = new AWS.S3();
    return s3.getObject({
      Bucket: this.sourceBucket,
      Key: `${id}.tif`
    }).createReadStream();
  }
}

module.exports = {
  handler: middy(handleRequest)
    .use(httpHeaderNormalizer())
    .use(cors())
};
