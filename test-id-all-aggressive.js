var nodebleconnector = require('./nodebleconnector');
var readline = require('readline');

var bleConnector = new nodebleconnector.AggressiveBLEConnector();
var blePheripherals = [];

var confOne = {
	deviceIds: ["34b1f7d13caa", "b0b448b8fa80"],
	serviceUUID: "ffe0",
	txUUID: null,
	rxUUID: "ffe1",
	autoReconnect: true,
	onSetup: function (status, sender) {
		blePheripherals.push(sender);
		if (status) {
			console.log("eveything is setup fine, you can start sending messages now");
		} else {
			console.log("failed to setup the communication");
		}
	},
	onDataCallback: function (data, isNotification, sender) {
		console.log("got data -> " + data + "(" + data.toString('hex') + ")");
	}
};
bleConnector.scanById(confOne);
var confTwo = {
	deviceIds: ["00a0500f2b19"],
	serviceUUID: "1901",
	txUUID: "1",
	rxUUID: "2",
	stopOnFirst: true,
	scanAll: false,
	onSetup: function (status, sender) {
		blePheripherals.push(sender);
		if (status) {
			console.log("eveything is setup fine, you can start sending messages now");
			sender.sendData(new Buffer("startcleaning"));
		} else {
			console.log("failed to setup the communication");
		}
	},
	onDataCallback: function (data, isNotification, sender) {
		console.log("got data -> " + data);
	}
};
bleConnector.scanById(confTwo);


this.rl = readline.createInterface(process.stdin, process.stdout);
this.rl.setPrompt('>');
this.rl.prompt();
this.rl.on('line', function (line) {
	blePheripherals.forEach(function (blePheripheral) {
		blePheripheral.sendData(new Buffer(line.trim()));
	}, this);
}).on('close', function () {
	blePheripherals.forEach(function (blePheripheral) {
		blePheripheral.disconnect();
	}, this);
	process.exit(0);
}.bind(this));
