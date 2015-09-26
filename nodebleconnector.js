"use strict";

var util = require('util');
var noble = require('noble');

function BLEConnector(serviceUUID, txUUID, rxUUID, onSetup, onDataCallback) {
	this.serviceUUID = serviceUUID;
	this.txUUID = txUUID;
	this.rxUUID = rxUUID;
	this.onSetup = onSetup;
	this.onDataCallback = onDataCallback;
	this.currentPeripheral = null;
	this.writeCharacteristic = null;
	this.readCharacteristic = null;

	noble.on('scanStart', this.onScanStart.bind(this));

	noble.on('scanStop', this.onScanStop.bind(this));

	noble.on('stateChange', this.onStateChange.bind(this));

	noble.on('discover', this.onPeripheralDiscovered.bind(this));

}

BLEConnector.prototype.onScanStart = function () {
	console.log('on -> scanStart');
}

BLEConnector.prototype.onScanStop = function () {
	console.log('on -> scanStop');
}

BLEConnector.prototype.onStateChange = function (state) {
	console.log('on -> stateChange: ' + state);
	if (state === 'poweredOn') {
		noble.startScanning([this.serviceUUID]);
	} else {
		noble.stopScanning();
	}
}

BLEConnector.prototype.onPeripheralDiscovered = function (peripheral) {
	console.log('on -> discover: ' + peripheral);
	noble.stopScanning();
	this.currentPeripheral = peripheral;
	peripheral.on('connect', this.onPeripheralConnected.bind(this));
	peripheral.on('disconnect', this.onPeripheralDisconnected.bind(this));
	peripheral.connect();
}

BLEConnector.prototype.onPeripheralConnected = function () {
	this.currentPeripheral.discoverSomeServicesAndCharacteristics([this.serviceUUID], [this.txUUID, this.rxUUID], this.onDiscoveredServicesAndCharacteristics.bind(this));
}

BLEConnector.prototype.onPeripheralDisconnected = function () {
	console.log('on -> disconnect');
}

BLEConnector.prototype.onDiscoveredServicesAndCharacteristics = function (error, services, characteristics) {
	if (0 < characteristics.length) {
		var writeSet = false;
		var readSet = false;
		characteristics.forEach(function (characteristic) {
			if (this.txUUID == characteristic.uuid) {
				this.writeCharacteristic = characteristic;
				writeSet = true;
			}
			if (this.rxUUID == characteristic.uuid) {
				this.readCharacteristic = characteristic;
				characteristic.on('read', this.onData.bind(this));
				characteristic.notify(true);
				readSet = true;
			}
		}, this);
		if (readSet && writeSet) {
			this.onSetup(true);
		} else {
			this.onSetup(false);
		}
	}
}


BLEConnector.prototype.onData = function (data, isNotification) {
	this.onDataCallback(data, isNotification, this);
}

BLEConnector.prototype.sendData = function (data) {
	if (null != this.writeCharacteristic) {
		this.writeCharacteristic.write(data);
	}
}

BLEConnector.prototype.disconnect = function () {
	if (null != this.currentPeripheral) {
		this.currentPeripheral.disconnect();
	}
}

module.exports.BLEConnector = BLEConnector;
