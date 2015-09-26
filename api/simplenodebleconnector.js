"use strict";

var util = require('util');
var noble = require('noble');
var blePeripheral = require('./bleperipheral');

function BLEConnector() {
	this.foundDevices = [];
	this.state = "unknown";
	this.scanning = false;
	noble.on('scanStart', this.onScanStart.bind(this));
	noble.on('scanStop', this.onScanStop.bind(this));
	noble.on('stateChange', this.onStateChange.bind(this));
	noble.on('discover', this.onPeripheralDiscovered.bind(this));
}

//deviceIds, serviceUUID, txUUID, rxUUID, stopOnFirst, onSetup, onDataCallback, filter, scanAll
BLEConnector.prototype.scanByFilter = function (conf) {
	this.conf = conf;
	if (null != conf["deviceIds"]) {
		this.conf["stopOnFirst"] = false;
		this.conf["scanAll"] = true;
	}
	if (null == conf["stopOnFirst"]) {
		this.conf["stopOnFirst"] = true;
	}

	if ("poweredOn" == this.state && !this.scanning) {
		this.doScan();
	}

}

BLEConnector.prototype.scanAny = function (conf) {
	conf.filter = function (pheripheral) { return true; };
	this.scanByFilter(conf);
}

BLEConnector.prototype.scanById = function (conf) {
	conf.filter = function (pheripheral) { return -1 < this.conf.deviceIds.indexOf(pheripheral.id); }.bind(this);
	this.scanByFilter(conf);
}

BLEConnector.prototype.onScanStart = function () {
	console.log('on -> scanStart');
}

BLEConnector.prototype.onScanStop = function () {
	console.log('on -> scanStop');
}

BLEConnector.prototype.doScan = function () {
	console.log('do -> scan');
	if (this.conf) {
		if (this.conf.scanAll) {
			console.log('scanning  all');
			noble.startScanning();
			this.scanning = true;
		} else {
			console.log('scanning by : ' + this.conf.serviceUUID);
			noble.startScanning([this.conf.serviceUUID]);
		}
	}
}

BLEConnector.prototype.onStateChange = function (state) {
	console.log('on -> stateChange: ' + state);
	this.state = state;
	if (state === 'poweredOn') {
		this.doScan();
	} else {
		this.stopScanning();
	}
}

BLEConnector.prototype.stopScanning = function (peripheral) {
	noble.stopScanning();
	this.scanning = false;
}

BLEConnector.prototype.onPeripheralDiscovered = function (peripheral) {
	if (null == this.conf.filter || this.conf.filter(peripheral)) {
		if (this.conf.stopOnFirst) {
			console.log("this.conf.stopOnFirst");
			this.stopScanning();
		} else if (Array.isArray(this.conf.deviceIds)) {
			if (-1 == this.foundDevices.indexOf(peripheral.id)) {
				this.foundDevices.push(peripheral.id);
			}
			console.log(this.conf.deviceIds.length);
			console.log(this.foundDevices.length);
			if (this.conf.deviceIds.length == this.foundDevices.length) {
				this.stopScanning();
			}
		}
		console.log('on -> discover: ' + peripheral);
		new blePeripheral.BLEPeripheralConnector(peripheral, this.conf);
	}
}


module.exports.BLEConnector = BLEConnector;
