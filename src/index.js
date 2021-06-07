'use strict';

const apiModule = require('./api')
  , modelModule = require('./model');

module.exports = async tools => {
  const {log} = tools
    , {metetrentino, close} = await apiModule(tools)
    , {storeData} = await modelModule(tools);

  return async function gathering() {
    const metetrentinoData = await metetrentino();

    await close();

    for (const {timestamp, ...rest} of metetrentinoData) {

      debugger;
      log.info(`${timestamp}: ${Object.keys(rest)}`);
      log.info(storeData);
    }
    return {
      ...metetrentinoData
    };
  };

};
