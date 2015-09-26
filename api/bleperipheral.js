
"use strict";

var util = require('util');
var noble = require('noble');

function BLEPeripheralConnector(peripheral, conf) {
	this.writeCharacteristic = null;
	this.readCharacteristic = null;
	this.currentPeripheral = peripheral;
	this.conf = conf;
	peripheral.once('connect', this.onPeripheralConnected.bind(this));
	peripheral.once('disconnect', this.onPeripheralDisconnected.bind(this));
	peripheral.connect();
	console.log('trying to connect ' + peripheral);
}

BLEPeripheralConnector.prototype.onPeripheralConnected = function () {
	console.log('connected to ' + this.currentPeripheral.id);
	if (null != this.conf.txUUID && null != this.conf.txUUID) {
		this.currentPeripheral.discoverSomeServicesAndCharacteristics([this.conf.serviceUUID], [this.conf.txUUID, this.conf.rxUUID], this.onDiscoveredServicesAndCharacteristics.bind(this));
	} else if (null != this.conf.txUUID) {
		this.currentPeripheral.discoverSomeServicesAndCharacteristics([this.conf.serviceUUID], [this.conf.txUUID], this.onDiscoveredServicesAndCharacteristics.bind(this));
	} else {
		this.currentPeripheral.discoverSomeServicesAndCharacteristics([this.conf.serviceUUID], [this.conf.rxUUID], this.onDiscoveredServicesAndCharacteristics.bind(this));
	}
}

BLEPeripheralConnector.prototype.onPeripheralDisconnected = function () {
	console.log('on -> disconnect');
}

BLEPeripheralConnector.prototype.onDiscoveredServicesAndCharacteristics = function (error, services, characteristics) {
	if (0 < characteristics.length) {
		var writeSet = false;
		var readSet = false;
		characteristics.forEach(function (characteristic) {
			if (null == this.conf.txUUID) {
				writeSet = true;
			} else if (this.conf.txUUID == characteristic.uuid) {
				this.writeCharacteristic = characteristic;
				writeSet = true;
			}
			if (null == this.conf.rxUUID) {
				readSet = true;
			} else if (this.conf.rxUUID == characteristic.uuid) {
				this.readCharacteristic = characteristic;
				characteristic.on('read', this.onData.bind(this));
				characteristic.notify(true);
				readSet = true;
			}
		}, this);
		if (null != this.conf.onSetup) {
			this.conf.onSetup(readSet && writeSet, this);
		}
	}
}


BLEPeripheralConnector.prototype.onData = function (data, isNotification) {
	if (null != this.conf.onDataCallback) {
		this.conf.onDataCallback(data, isNotification, this);
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

module.exports.BLEPeripheralConnector = BLEPeripheralConnector;