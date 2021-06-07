'use strict';

const apiModule = require('./api')
  , modelModule = require('./model');

module.exports = async tools => {
  const {metetrentino, close} = await apiModule(tools)
    , {write} = await modelModule(tools);

  return async function gathering() {
    const metetrentinoData = await metetrentino();

    await close();
    return await write(metetrentinoData);
  };

};
