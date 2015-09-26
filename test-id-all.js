var nodebleconnector = require('./nodebleconnector');
var readline = require('readline');

var bleConnector = new nodebleconnector.BLEConnector();
var blePheripherals = [];

bleConnector.scanAllById("34b1f7d13caa", "ffe0", null, "ffe1", function (status, sender) {
	blePheripherals.push(sender);
	if (status) {
		console.log("eveything is setup fine, you can start sending messages now");
	} else {
		console.log("failed to setup the communication");
	}
}, function (data, isNotification, sender) {
	console.log("got data -> " + data + "(" + data.toString('hex') + ")");
});

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