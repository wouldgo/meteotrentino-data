'use strict';
const {InfluxDB} = require('@influxdata/influxdb-client');

module.exports = () => {


// You can generate a Token from the "Tokens Tab" in the UI
const token = 'CdYSg_Jnsqf3vv_HJNg_YOkw7xKrdQhVzl1rVkWhS6gW138oyBJMlSxzJrhYqTtZMHymk_hNpAoN2wdGv4Z82A==';
const org = 'home';
const bucket = 'core-data';

const client = new InfluxDB({'url': 'http://influxdb.lan', token});
};
