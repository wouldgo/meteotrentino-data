'use strict';
const parser = require('xml2json')
  , zonedTimeToUtc = require('date-fns-tz/zonedTimeToUtc')
  , parse = require('date-fns/parse')
  , isSameMinute = require('date-fns/isSameMinute')
  , parserOptions = {
    'object': true,
    'coerce': true
  }
  , humidexDatePattern = /^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2}):(\d{2})$/
  , makePoint = (data, measure, value) => {
      const date = zonedTimeToUtc(data);

      return {
        'timestamp': date,
        measure,
        value
      };
    }
  , parseStats = data => {
      const {lastData} = parser.toJson(data, parserOptions)
        , rains = lastData.precipitation_list.precipitation.map(aRain => makePoint(
          aRain.date,
          aRain.UM,
          aRain.value
        ))
        , radiations = lastData.global_radiation_list.global_radiation.map(aRadiation => makePoint(
          aRadiation.date,
          aRadiation.UM,
          aRadiation.value
        ))
        , temperatures = lastData.temperature_list.air_temperature.map(aTemperature => makePoint(
          aTemperature.date,
          aTemperature.UM,
          aTemperature.value
        ))
        , humidity = lastData.relative_humidity_list.relative_humidity.map(aMoisture => makePoint(
          aMoisture.date,
          aMoisture.UM,
          aMoisture.value
        ));

      return {
        rains,
        radiations,
        temperatures,
        humidity
      };
    }
  , parseHumidex = (name, data) => {
      const {ArrayOfStazione} = parser.toJson(data, parserOptions);

      for (const aStation of ArrayOfStazione.stazione) {
        if (aStation.nome.startsWith(name)) {
          const {'val_humidex': humidexValue, 'datamisura': timestamp} = aStation
            , [, day, month, year, hours, minutes, seconds] = humidexDatePattern.exec(timestamp)
            , date = zonedTimeToUtc(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}.000`, 'Europe/Rome');

          return {
            'timestamp': date,
            'measure': 'index',
            'value': humidexValue
          };
        }
      }
    }
  , parsePressure = data => {
      const {html} = parser.toJson(data, parserOptions)
        , jsBloat = html.head.script[2].$t
        , unbloated = jsBloat.split(/barValues=(.+],]);/)[1]
            .replace(/\'/gi, '"')
            .replace('],]', ']]')
        , datas = JSON.parse(unbloated)
        , toReturn = [];

      for (const [stringyData, value] of datas) {
        const date = zonedTimeToUtc(parse(stringyData, 'd/M \'h.\'H:m', new Date()), 'Europe/Rome');

        toReturn.push({
          'timestamp': date,
          'measure': 'hPa',
          value
        });
      }
      return toReturn;
    };

module.exports = async function meteoTrentinoModule({Client, checkCode, log, meteotrentino}) {
  const {stations} = meteotrentino
    , client = new Client('http://dati.meteotrentino.it')
    , contentMeteotrentinoClient = new Client('https://content.meteotrentino.it')
    , weatherStationData = async function weatherStationData(code) {
        log.debug('GET weather station data');
        const {statusCode, body} = await client.request({
          'path': `/service.asmx/getLastDataOfMeteoStation?codice=${code}`,
          'method': 'GET'
        });

        log.debug('GET weather station data returns');
        const data = await checkCode(body, statusCode)
          , thisStats = parseStats(data);

        log.debug('GET weather station data response parsed');

        return thisStats;
      }
    , humidexData = async function humidexData() {
        log.debug('GET humidex data');
        const {statusCode, body} = await client.request({
          'path': '/service.asmx/getHumidex',
          'method': 'GET'
        });

        log.debug('GET humidex data returns');
        const data = await checkCode(body, statusCode);

        log.debug('GET humidex data response parsed');

        return data;
      }
    , pressureData = async function pressureData(code) {
        log.debug('GET pressure data');
        let thisStats = [];

        try {
          const {statusCode, body} = await contentMeteotrentinoClient.request({
            'path': `/dati-meteo/stazioni/grafici/BAR.aspx?id=${code}`,
            'method': 'GET'
          });

          log.debug('GET pressure data returns');

          const data = await checkCode(body, statusCode);

          thisStats = parsePressure(data);
          log.debug('GET pressure data response parsed');

          return thisStats;
        } catch (err) {

          log.error(err, 'GET pressure data went in error');
        } finally {

          return timestamp => thisStats.find(elm => isSameMinute(elm.timestamp, timestamp));
        }
      };

  if (stations.length === 0) {

    throw new Error('No stations are declared');
  }

  return {
    'stats': async function stats() {
      const statsToReturn = []
        , actualHumidexData = await humidexData();

      for (const {code, name} of stations) {
        const {rains, radiations, temperatures, humidity} = await weatherStationData(code)
          , pressures = await pressureData(code)
          , {'timestamp': timestampHumidex, ...restHumidex} = parseHumidex(name, actualHumidexData);

        for (let index = 0; index < temperatures.length; index += 1) {
          const {timestamp, ...restTemp} = temperatures[index]
            , {'timestamp': timestampRains, ...restRains} = rains[index]
            , {'timestamp': timestampRadiations, ...restRadiations} = radiations[index]
            , {'timestamp': timestampMoisture, ...restHumidity} = humidity[index]
            , pressureDataPoint = pressures(timestamp);

          if (isSameMinute(timestamp, timestampRains) &&
            isSameMinute(timestampRains, timestampRadiations) &&
            isSameMinute(timestampRadiations, timestampMoisture)) {
            const toPush = {
                timestamp,
                'city': name,
                'temperature': restTemp,
                'humidity': restHumidity,
                'rains': restRains,
                'radiations': restRadiations
              };

            if (isSameMinute(timestamp, timestampHumidex)) {

              toPush.humidex = restHumidex;
            }

            if (pressureDataPoint != null) {
              delete pressureDataPoint.timestamp;

              toPush.pressure = pressureDataPoint;
            }

            statsToReturn.push(toPush);
          } else {

            log.warn(`Timestamp for ${name} didn't match`);
          }
        }
      }

      log.info(`Returning ${statsToReturn.length} data points`);
      return statsToReturn;
    },
    'close': () => Promise.all([
      contentMeteotrentinoClient.close(),
      client.close()
    ])
  };
};
