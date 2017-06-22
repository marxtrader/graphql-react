

/*
 *   1. create subscription key
 *   2. send subscription key into server via socket
 *   3. get response message from server
 *   4. parse response message (show in log)
 *   5. show message in bid ans ask fields 
 */

 



//
//watchListHandleTick = function(message) {
//      
//        var allSubIndex = 0;
//        if (widget.allSubscriptions.indexOf(message.subKey) !== -1) {
//            allSubIndex = widget.allSubscriptions.indexOf(message.subKey);
//        } else {
//            allSubscriptions.push(message.subKey);
//            allSubIndex = widget.allSubscriptions.indexOf(message.subKey);
//        }
//
//        // initialize history array if needed
//        if (widget.allSubHistory[allSubIndex] === undefined) {
//            widget.allSubHistory[allSubIndex] = [];
//        }
//
//        // Put update info into a template table row.
//        var decimals = 5;
//        if (message.symbol.indexOf("JPY") != -1) {
//            decimals = 3;
//        }
//
//        var newBid = message.bidPrice.toFixed(decimals);
//        var newAsk = message.askPrice.toFixed(decimals);
//
//        var prices = {
//            "bid": message.bidPrice,
//            "ask": message.askPrice
//        };
//        if (widget.allSubHistory[allSubIndex].length > 49) { // cap at 100 points for now
//            widget.allSubHistory[allSubIndex].shift();
//        }
//        widget.allSubHistory[allSubIndex].push(prices);
//
//        var bidArray = [];
//        var askArray = [];
//        var thisMin = 0;
//        var thisMax = 0;
//        for (var i = 0; i < widget.allSubHistory[allSubIndex].length; i++) {
//            var thisBid = widget.allSubHistory[allSubIndex][i].bid;
//            var thisAsk = widget.allSubHistory[allSubIndex][i].ask;
//
//            if (thisMin == 0) {
//                thisMin = (thisAsk < thisBid) ? thisAsk : thisBid;
//            } else {
//                thisMin = (thisBid < thisMin) ? thisBid : thisMin;
//                thisMin = (thisAsk < thisMin) ? thisAsk : thisMin;
//            }
//            if (thisMax == 0) {
//                thisMax = (thisAsk > thisBid) ? thisAsk : thisBid;
//            } else {
//                thisMax = (thisBid > thisMax) ? thisBid : thisMax;
//                thisMax = (thisAsk > thisMax) ? thisAsk : thisMax;
//            }
//            bidArray.push(thisBid);
//            askArray.push(thisAsk);
//        }
//
//        for (var j = 0; j < self.listOfWatchlists().length; j++) {
//            var WL = self.listOfWatchlists()[j];
//            for (var n = 0; n < WL.map().length; n++) {
//                var mapOfWL = WL.map()[n];
//                var myStringObject = JSON.parse(message.subKey);
//
//                if (mapOfWL.bidPrice == undefined || mapOfWL.askPrice == undefined) {
//                    mapOfWL.bidPrice = new ko.observable();
//                    mapOfWL.bidExchange = new ko.observable();
//                    mapOfWL.bidSize = new ko.observable();
//                    mapOfWL.askPrice = new ko.observable();
//                    mapOfWL.askExchange = new ko.observable();
//                    mapOfWL.askSize = new ko.observable();
//                }
//
//                if (mapOfWL.foundRoute != undefined && mapOfWL.symbol == myStringObject.symbol && mapOfWL.foundRoute.carrier == myStringObject.carrier && mapOfWL.foundRoute.marketid == myStringObject.market && mapOfWL.foundRoute.level == myStringObject.level && mapOfWL.foundRoute.supplier == myStringObject.supplier) {
//                    mapOfWL.bidPrice(newBid);
//                    mapOfWL.bidExchange(message.bidExchange);
//                    mapOfWL.bidSize(message.bidSize);
//                    mapOfWL.askPrice(newAsk);
//                    mapOfWL.askExchange(message.askExchange);
//                    mapOfWL.askSize(message.askSize);
//                } else {
//                    continue;
//                }
//            }
//        }
//    };   
