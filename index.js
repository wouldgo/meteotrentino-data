'use strict';

// eslint-disable-next-line import/no-unassigned-import
require('make-promises-safe');

const logger = require('pino')
  , conf = require('./_conf')
  , {name, version} = require('./package')
  , log = logger({
      'level': conf.log.level
    })
  , gatherDataModule = require('./src');

(async function entryPoint() {
  const gatherData = await gatherDataModule({
      ...conf,
      log
    });

  log.info(`${name}@${version} starting to gather data....`);
  try {

    await gatherData();
    log.info(`${name}@${version} gathered data....`);
  } catch (err) {

    log.error(err, 'Error during data gathering');
  }
}());
