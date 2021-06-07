'use strict';
const {InfluxDB, Point} = require('@influxdata/influxdb-client');

module.exports = ({log, influxDb}) => {
  const {token, org, bucket, url} = influxDb
    , client = new InfluxDB({url, token})
    , writeApi = client.getWriteApi(org, bucket);

  writeApi.useDefaultTags({
    'host': 'meteotrentino-agent',
    'infra': 'meteotrentino'
  });
  return {
    'write': async function doWrite(data) {
      for (const {timestamp, city, ...rest} of data) {

        const point = new Point('weather');

        point.timestamp(timestamp);
        point.tag('city', city);
        for (const [key, timePoint] of Object.entries(rest)) {
          const {value} = timePoint;

          if (key === 'humidity') {

            point.intField(key, value);
          } else {

            point.floatField(key, value);
          }
          writeApi.writePoint(point);
        }
      }

      try {

        await writeApi.close();
      } catch (err) {

        log.error(err, 'Writing data went in error');
        throw err;
      }
    }
  };
};
