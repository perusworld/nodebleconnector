"use strict";

var util = require('util');
var noble = require('noble');

function BLEConnector() {
	this.stopOnFirst = false;
	this.serviceUUID = null;
	this.txUUID = null;
	this.rxUUID = null;
	this.currentPeripheral = null;
	this.writeCharacteristic = null;
	this.readCharacteristic = null;
}

BLEConnector.prototype.scanByFilter = function (serviceUUID, txUUID, rxUUID, stopOnFirst, onSetup, onDataCallback, filter) {
	this.serviceUUID = serviceUUID;
	this.txUUID = txUUID;
	this.rxUUID = rxUUID;
	this.stopOnFirst = stopOnFirst;
	this.onSetup = onSetup;
	this.onDataCallback = onDataCallback;
	this.filter = filter;
	this.writeCharacteristic = null;
	this.readCharacteristic = null;

	noble.on('scanStart', this.onScanStart.bind(this));

	noble.on('scanStop', this.onScanStop.bind(this));

	noble.on('stateChange', this.onStateChange.bind(this));

	noble.on('discover', this.onPeripheralDiscovered.bind(this));

}

BLEConnector.prototype.scanAnyOne = function (serviceUUID, txUUID, rxUUID, onSetup, onDataCallback) {
	this.scanByFilter(serviceUUID, txUUID, rxUUID, true, onSetup, onDataCallback, function (pheripheral) { return true; });
}

BLEConnector.prototype.scanById = function (deviceId, serviceUUID, txUUID, rxUUID, onSetup, onDataCallback) {
	this.scanByFilter(serviceUUID, txUUID, rxUUID, true, onSetup, onDataCallback, function (pheripheral) { return deviceId == pheripheral.id; });
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

BLEConnector.prototype.stopScanning = function (peripheral) {
	noble.stopScanning();
}

BLEConnector.prototype.onPeripheralDiscovered = function (peripheral) {
	console.log('on -> discover: ' + peripheral);
	if (null == this.filter || this.filter(peripheral)) {
		if (this.stopOnFirst) {
			noble.stopScanning();
		}
		new BLEPeripheralConnector(peripheral, this);
	}
}

function BLEPeripheralConnector(peripheral, sender) {
	this.currentPeripheral = peripheral;
	this.sender = sender;
	peripheral.on('connect', this.onPeripheralConnected.bind(this));
	peripheral.on('disconnect', this.onPeripheralDisconnected.bind(this));
	peripheral.connect();
	console.log('trying to connect');
}

BLEPeripheralConnector.prototype.onPeripheralConnected = function () {
	this.currentPeripheral.discoverSomeServicesAndCharacteristics([this.sender.serviceUUID], [this.sender.txUUID, this.sender.rxUUID], this.onDiscoveredServicesAndCharacteristics.bind(this));
}

BLEPeripheralConnector.prototype.onPeripheralDisconnected = function () {
	console.log('on -> disconnect');
}

BLEPeripheralConnector.prototype.onDiscoveredServicesAndCharacteristics = function (error, services, characteristics) {
	if (0 < characteristics.length) {
		var writeSet = false;
		var readSet = false;
		characteristics.forEach(function (characteristic) {
			if (this.sender.txUUID == characteristic.uuid) {
				this.writeCharacteristic = characteristic;
				writeSet = true;
			}
			if (this.sender.rxUUID == characteristic.uuid) {
				this.readCharacteristic = characteristic;
				characteristic.on('read', this.onData.bind(this));
				characteristic.notify(true);
				readSet = true;
			}
		}, this);
		if (null != this.sender.onSetup) {
			this.sender.onSetup(readSet && writeSet, this);
		}
	}
}


BLEPeripheralConnector.prototype.onData = function (data, isNotification) {
	if (null != this.sender.onDataCallback) {
		this.sender.onDataCallback(data, isNotification, this);
	}
}

BLEPeripheralConnector.prototype.sendData = function (data) {
	if (null != this.writeCharacteristic) {
		this.writeCharacteristic.write(data);
	}
}

BLEPeripheralConnector.prototype.disconnect = function () {
	if (null != this.currentPeripheral) {
		this.currentPeripheral.disconnect();
	}
}

module.exports.BLEConnector = BLEConnector;
module.exports.BLEPeripheralConnector = BLEPeripheralConnector;
