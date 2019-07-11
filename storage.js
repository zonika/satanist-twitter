'use strict';

const request = require('request'),
  aws = require('aws-sdk');

const s3 = new aws.S3();
const Bucket = 'zoes-pics-from-twitter';

function downloadThenUpload({ url, type }) {
  const Key = url.split('/').pop();
  console.log(url, Key);
  return s3.putObject({
    Body: request(url),
    Bucket, Key
  }).promise().then(({ data }) => ({ url: data.location, type }));
}

module.exports = { downloadThenUpload };
