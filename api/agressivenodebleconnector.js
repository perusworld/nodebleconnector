"use strict";

var util = require('util');
var noble = require('noble');
var blePeripheral = require('./bleperipheral');

function AggressiveBLEConnector() {
	this.foundDevices = [];
	this.foundDeviceIds = [];
	this.scanQueue = [];
	noble.on('scanStart', this.onScanStart.bind(this));
	noble.on('scanStop', this.onScanStop.bind(this));
	noble.on('stateChange', this.onStateChange.bind(this));
	noble.on('discover', this.onPeripheralDiscovered.bind(this));
}

AggressiveBLEConnector.prototype.scanById = function (conf) {
	conf.filter = function (pheripheral) { return -1 < this.conf.deviceIds.indexOf(pheripheral.id); }.bind(this);
	conf.deviceIds.forEach(function (deviceId) {
		var peripheral = this.foundDevices[deviceId];
		if (null == peripheral) {
			this.scanQueue[deviceId] = conf;
		} else {
			if ("disconnected" == peripheral.state) {
				//adding it back to queue
				if (conf.autoReconnect) {
					this.scanQueue[deviceId] = conf;
				}
			}
			//new blePeripheral.BLEPeripheralConnector(peripheral, conf);
		}
	}, this);
}

AggressiveBLEConnector.prototype.onScanStart = function () {
	console.log('on -> scanStart');
}

AggressiveBLEConnector.prototype.onScanStop = function () {
	console.log('on -> scanStop');
}

AggressiveBLEConnector.prototype.onStateChange = function (state) {
	console.log('on -> stateChange: ' + state);
	if (state === 'poweredOn') {
		noble.startScanning([], true);
	} else {
		noble.stopScanning();
	}
}

AggressiveBLEConnector.prototype.stopScanning = function (peripheral) {
	noble.stopScanning();
}

AggressiveBLEConnector.prototype.onPeripheralDiscovered = function (peripheral) {
	if (-1 == this.foundDeviceIds.indexOf(peripheral.id)) {
		this.foundDeviceIds.push(peripheral.id);
		this.foundDevices[peripheral.id] = peripheral;
	}
	this.handlePheripheral(peripheral);
}

AggressiveBLEConnector.prototype.handlePheripheral = function (peripheral) {
	var conf = this.scanQueue[peripheral.id];
	if (null != conf) {
		if (conf.autoReconnect) {
			if ("disconnected" == peripheral.state) {
				new blePeripheral.BLEPeripheralConnector(peripheral, conf);
			}
		} else {
			this.scanQueue[peripheral.id] = null;
			new blePeripheral.BLEPeripheralConnector(peripheral, conf);
		}
	}
}



module.exports.AggressiveBLEConnector = AggressiveBLEConnector;
