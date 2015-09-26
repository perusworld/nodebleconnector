"use strict";

var simplenodebleconnector = require('./api/simplenodebleconnector')
var agressivenodebleconnector = require('./api/agressivenodebleconnector')

module.exports.BLEConnector=simplenodebleconnector.BLEConnector
module.exports.AggressiveBLEConnector=agressivenodebleconnector.AggressiveBLEConnector
