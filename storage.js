'use strict';

import request from 'request';
import aws from 'aws-sdk';

const s3 = new aws.S3();
const Bucket = 'zoes-pics-from-twitter';

function downloadThenUpload({ url, type }) {
  const Key = url.split('/').pop();
  return s3.putObject({
    body: request(url),
    Bucket, Key
  }).(({ data }) => ({ url: data.location, type }));
}

module.exports = { downloadThenUpload };
