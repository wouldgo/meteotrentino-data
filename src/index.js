'use strict';

const apiModule = require('./api');

module.exports = async tools => {
  const {log} = tools
    , {metetrentino, close} = await apiModule(tools);

  return async function gathering() {
    const metetrentinoData = await metetrentino();

    await close();

    for (const {timestamp, ...rest} of metetrentinoData) {

      log.info(`${timestamp}: ${Object.keys(rest)}`);
    }
    return {
      ...metetrentinoData
    };
  };

};
