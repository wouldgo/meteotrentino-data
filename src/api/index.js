'use strict';

const {Client} = require('undici')
  , meteoTrentinoModule = require('./meteotrentino')
  , checkCode = async function checkCode(body, statusCode) {
      const chunks = [];

      for await (const chunk of body) {
        chunks.push(chunk);
      }

      const stringyfiedBufferResponse = Buffer.concat(chunks).toString('utf-8');

      if (statusCode < 200 && statusCode > 300) {

        throw new Error(stringyfiedBufferResponse || JSON.stringify({
          'status': statusCode
        }));
      }

      return stringyfiedBufferResponse;
    };

module.exports = async function externalApiModule(tools) {
  const toApis = {
        Client,
        checkCode,
        ...tools
      }
    , {'close': meteotrentinoClose, stats} = await meteoTrentinoModule(toApis);

  return {
    'metetrentino': stats,
    'close': async function close() {

      await meteotrentinoClose();
    }
  };
};
