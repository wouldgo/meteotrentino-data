'use strict';

const {
    LOG_LEVEL = 'debug',

    METEOTRENTINO_STATIONS = JSON.stringify([
      {
        'code': 'T0147',
        'name': 'Rovereto',
        'altitude': 203
      }
    ])
  } = process.env;


module.exports = {
  'log': {
    'level': LOG_LEVEL
  },
  'meteotrentino': {
    'stations': JSON.parse(METEOTRENTINO_STATIONS)
  }
};
