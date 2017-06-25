
var ordersCore = require('./marx.orders.core.js');
var constr = require('./constructor.js');

// default settings
var options = {
    showDetail: true, // whether we should allow drilldown from summary to details
    selector: 'Positions', // override to set a different selector
    showAdjustments: true, // Should we show adjustments made to this account and allow adding new ones
    qtyAsLots: true, // Show quantity as lots
    lotSize: 100000, // Size of a lot if using qtyAsLots
    posdialogselector: 'adjustmentDialog',
    accountChangeTopic: 'selectedAccount',
    templateName: 'positionWidgetTemplate-tpl'        
};

//var positionList = []; // TO DO: change this
var _exchangeList = []; // TO DO: change this

// for DOM render 
function updatePositionList (positionList) {
    var summaries = summarizePositions(positionList); // Reorder positions -> [{symbol, price, quantity, exchange, [POSITIONS per symbol]} ]
    var seenSymbols = []; // new
    var updatedPositions = []; // new
    for (var summaryKey in summaries) {
        var item = summaries[summaryKey];
        var symbol = item.symbol;
        var price = item.price.toFixed(2);
        var quantity = addCommas(options.qtyAsLots ? item.quantity / options.lotSize : item.quantity, 5);
        quantity = Math.round(quantity * 100) / 100;
        var positionSummary = new PositionSummary(price, quantity, symbol);
        seenSymbols.push(symbol);
        for (var i = 0; i < item.positions.length; i++) {
            var thisPos = item.positions[i];
            var thisInstrument = new Instrument(thisPos.instrument.symbol,
                    thisPos.instrument.baseSymbol,
                    thisPos.instrument.exchangeid,
                    thisPos.instrument.underlyingid,
                    thisPos.instrument.id,
                    thisPos.instrument.type,
                    thisPos.instrument.attributes);
            var thisExName = "N/A";
            _exchangeList.forEach(function (exchange) {
                if (exchange.id === thisPos.instrument.exchangeid) {
                    thisExName = exchange.description;
                }
            });
            positionSummary.allPositions.push(new Position(thisPos.accountid, thisPos.price, thisPos.quantity, thisInstrument, thisExName, options));
        }
        updatedPositions.push(positionSummary);
    }

// Remove any dead positions, updated any existing ones.
    for (var j = 0; j < positionList.length; j++) {
        var thisPosition = positionList[j];
        if (seenSymbols.indexOf(thisPosition.symbol()) === -1) {
            positionList.remove(thisPosition);
        } else {
            for (var k = 0; k < updatedPositions.length; k++) {
                var thisUpdatedPosition = updatedPositions[k];
                if (thisUpdatedPosition.symbol() === thisPosition.symbol()) {
// Maintain any selected positions through the refresh.
                    if (thisPosition.selectedPosition() !== null) {
                        thisUpdatedPosition.selectedPosition(thisUpdatedPosition);
                    }
                    if (thisPosition.currentPrice() !== null) {
                        thisUpdatedPosition.currentPrice(thisPosition.currentPrice());
                    }
                    positionList.replace(thisPosition, thisUpdatedPosition);
                }
            }
        }
    }

// Add any new positions
    for (var l = 0; l < updatedPositions.length; l++) {
        var thisUpdatedPosition = updatedPositions[l];
        var found = false;
        for (var m = 0; m < positionList().length; m++) {
            if (positionList()[m].symbol() === thisUpdatedPosition.symbol()) {
                found = true;
                break;
            }
        }
        if (!found) {
            positionList.push(thisUpdatedPosition);
        }
    }
    
    return positionList;
};

module.exports = {
        updatePositionList: updatePositionList
        };