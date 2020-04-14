/*
 * IMPLEMENTATION NOTE: API Gateway Lambda functions have a 
 * ~6MB payload limit. See LAMBDA_LIMIT.md for implications
 * and a workaround.
 */

const AWS = require('aws-sdk');
const IIIF = require('iiif-processor');
const middy = require('middy');
const { cors, httpHeaderNormalizer } = require('middy/middlewares');

const handleRequest = async (event, context) => {
  try {
    console.log("Handling request.")
    let result = await new IIIFLambda(event, context, process.env.tiffBucket).processRequest();
    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
    return err;
  }
};

class IIIFLambda {
  constructor (event, context, sourceBucket) {
    this.event = event;
    this.context = context;
    this.sourceBucket = sourceBucket;
    this.handled = false;
  }

  directResponse (result) {
    console.log("Sending response.");
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
    return response;
  }

  handleError (err, _resource) {
    console.log("Got error.");
    if (err.statusCode) {
      console.log(err);
      return {
        statusCode: err.statusCode,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Not Found'
      };
    } else if (err instanceof this.resource.errorClass) {
      console.log(err);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/plain' },
        body: err.toString()
      };
    } else {
      console.log(err);
      return;
    }
  }

  includeStage() {
    if ('include_stage' in process.env) {
      return ['true', 'yes'].indexOf(process.env.include_stage.toLowerCase()) > -1;
    } else {
      var host = this.event.headers['Host'];
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
    console.log("Checking for options request");
    if (this.handled) return;
    console.log("Not handled.")
    if (this.event.httpMethod === 'OPTIONS') {
      console.log("Options Request Detected");
      this.handled = true;
      return { statusCode: 204, body: null }
    }
  }

  checkForInfoJsonRedirect() {
    console.log("Checking for Info JSON Redirect");
    if (this.handled) return;
    console.log("Not handled.");
    if (this.fileMissing()) {
      console.log("File missing, redirecting.");
      var location = this.eventPath() + '/info.json';
      this.handled = true
      return { statusCode: 302, headers: { 'Location': location }, body: "Redirecting to info.json" };
    }
  }

  async execute() {
    console.log("Executing.");
    if (this.handled) return;

    var scheme = this.event.headers['X-Forwarded-Proto'] || 'http';
    var host = this.event.headers['X-Forwarded-Host'] || this.event.headers['Host'];
    var uri = `${scheme}://${host}${this.eventPath()}`;
    console.log(uri)

    this.resource = new IIIF.Processor(uri, id => this.s3Object(id));
    console.log("Got resource");
    this.handled = true
    console.log("Fired Resource Execution.");
    return this.resource
          .execute()
          .then(result => this.directResponse(result))
          .catch(err => this.handleError(err));
  }

  async processRequest () {
    AWS.config.region = this.context.invokedFunctionArn.match(/^arn:aws:lambda:(\w+-\w+-\d+):/)[1];

    return this.checkForOptionsRequest() || this.checkForInfoJsonRedirect() || this.execute()
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
