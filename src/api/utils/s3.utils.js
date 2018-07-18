const AWS = require('aws-sdk');
const path = require('path');
const logger = require(path.resolve('./config/logger'));
const { aws } = require(path.resolve('./config/vars'));

/**
* load the s3 config credentials
*/
AWS.config.loadFromPath(path.resolve('./awsS3Config.json'));

/**
 * Returns a s3 sign url for image direct upload
 * @private
 */
exports.getSignUrl = (req, res, next) => {
  if (!req.query.fileName && !req.query.fileType) {
    return next(new Error('File name & type not found in request'));
  }

  const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
  const s3Params = {
    Bucket: aws.s3Bucket,
    Key: req.query.fileName,
    Expires: aws.expires,
    // ContentType: req.query.fileType,
    ACL: 'public-read',
  };

  const bucketParams = {
    Bucket: aws.s3Bucket,
    Key: 'do-not-delete.txt',
  };
  s3.getObject(bucketParams, (err, data) => {
    if (err) {
      logger.log('** Bucket not found **');
      logger.error(err);
      return next(err);
    }
    console.log(data);
    s3.getSignedUrl('putObject', s3Params, (signerr, signdata) => {
      if (signerr) {
        logger.log('** Bucket couldn\'t sign url **');
        return next(signerr);
      }
      const returnData = {
        signedRequest: signdata,
        url: `https://${aws.s3Bucket}.s3.${aws.s3Region}.amazonaws.com/${req.query.fileName}`,
      };
      return res.send(returnData);
    });
  });
};
