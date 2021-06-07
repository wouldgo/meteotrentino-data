'use strict';

const {
    LOG_LEVEL = 'debug',

    METEOTRENTINO_STATIONS = JSON.stringify([
      {
        'code': 'T0147',
        'name': 'Rovereto',
        'altitude': 203
      }
    ]),

    INFLUXDB_TOKEN,
    INFLUXDB_ORG,
    INFLUXDB_BUCKET,
    INFLUXDB_URL
  } = process.env;


module.exports = {
  'log': {
    'level': LOG_LEVEL
  },
  'meteotrentino': {
    'stations': JSON.parse(METEOTRENTINO_STATIONS)
  },
  'influxDb': {
    'token': INFLUXDB_TOKEN,
    'org': INFLUXDB_ORG,
    'bucket': INFLUXDB_BUCKET,
    'url': INFLUXDB_URL
  }
};
