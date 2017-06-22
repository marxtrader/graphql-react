/**
 * Connect to marketdata and handle subscriptions.  Depends on WebSocket support and jQuery.
 */

// Constants - WebSocket URL
var WEBSOCKET_URL = "ws://"+document.domain+":8785/websocket";

// Constants - Status Updates
var WAITING_STATUS = "Feeder: Waiting for messages.";
var WEBSOCKET_CLOSED_STATUS = "Feeder: The WebSocket Connection Has Been Closed.";

// Constants - Incoming message types
var MESSAGE_HANDSHAKE = "handshake";

// WebSocket connection
var ws;
var wsConnected = false;

// Sequence number for WS messages.
var seqnum = 0;

// Make a subscription key object
function SubscriptionKey(symbol,market,carrier,supplier,level) {
	this.symbol = symbol;
	this.market = market;
	this.carrier = carrier;
	this.supplier = supplier;
	this.level = level;
	this.equals = function(other) {
		return other.symbol === this.symbol && other.market === this.market && other.carrier === this.carrier && other.supplier === this.supplier && other.level === this.level;
	};		
}

// Establish a WebSockets connection for streaming data
function connectData() {
	// Handler for .ready() called.
	// On the intial page load we perform the handshake with the server.
	
	var appType;
	if (typeof MozWebSocket !== "undefined") {
	     appType = "Mozilla";
	} else if (window.WebSocket) {
	     appType = "Chrome";
	} else {
	     $.publish("eventLog", ["ERROR: This browser does not support WebSockets."]);
		return;
	}
	if (appType === "Mozilla") {
	      ws = new MozWebSocket(WEBSOCKET_URL);
	} else {
	      ws = new WebSocket(WEBSOCKET_URL);
	}

	ws.onopen = function(event) {
		wsConnected = true;
		doSubscriptions();
		$.publish("eventLog", [WAITING_STATUS]);
	};

	ws.onclose = function(event) {
		wsConnected = false;
		$.publish("eventLog", [WEBSOCKET_CLOSED_STATUS]);
	};

	// Process message ("push") from the server -- these will be only marketdata updates.
	ws.onmessage = function(event) {
                var eventData = event.data;
                if (eventData.substring(0,2) === "SB") { 
                    return; // ignore subscription confirmations for now.
                }
		
                var message = jQuery.parseJSON(eventData);
                
                // this is a weak test, but so far only L2 has mmid.
                if (message.mmid === undefined) {                    
                    var subKey = new SubscriptionKey(message.symbol, message.exchange, message.carrier, message.supplier, "FOREXLEVEL1");		
                    message.subKey = JSON.stringify(subKey);		
                    $.publish("priceFeed", [message]);
                } else {
                    var subKey = new SubscriptionKey(message.symbol, message.exchange, message.carrier, message.supplier, "FOREXLEVEL2");		
                    message.subKey = JSON.stringify(subKey);		
                    $.publish("priceL2Feed", [message]);                    
                }
		
		//TODO: cache latest quotes to make them available for lookup.
	};
}

// Stack to store subscriptions until we have a connection.
// TODO: Maybe change to a list, behavior-wise, to resub if the WS connection is lost?
var queuedSubscriptions = new Array();
	
function doSubscriptions() {
	while (queuedSubscriptions.length > 0) {
		var sub = queuedSubscriptions.pop();
		subscribe(sub);
	}
}

// Build a JSON-ified subscribe message and send over WebSocket connection
function subscribe(SubscriptionKey) {
	if (!wsConnected) {
		queuedSubscriptions.push(SubscriptionKey);
		return;
	}
	var message = {
		"subscribe" : "true",
		"level" : SubscriptionKey.level,
		"symbol" : SubscriptionKey.symbol,
		"market" : SubscriptionKey.market,
		"carrier" : SubscriptionKey.carrier,
		"seqno" : ++seqnum,
		"supplier" : SubscriptionKey.supplier
	};
	var encoded = JSON.stringify(message);
	ws.send("SB"+encoded);
}

// Build a JSON-ified unsubscribe message and send over WebSocket connection
function unsubscribe(SubscriptionKey) {
	var message = {
		"subscribe" : "false",
		"level" : SubscriptionKey.level,
		"symbol" : SubscriptionKey.symbol,
		"market" : SubscriptionKey.market,
		"carrier" : SubscriptionKey.carrier,
		"seqno" : ++seqnum,
		"supplier" : SubscriptionKey.supplier
	};
	var encoded = JSON.stringify(message);
	ws.send("SB"+encoded);
}
