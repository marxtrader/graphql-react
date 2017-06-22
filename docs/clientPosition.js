
var PositionWidget;
/*
 * Requires marx.orderdata.core.js, the REST services, pubsub, and jquery.
 */

function koInstrument(symbol, baseSymbol, exchangeid, underlyingid, id, type, attributes) {
    var self = this;
    self.symbol = symbol;
    self.baseSymbol = baseSymbol;
    self.exchangeID = exchangeid;
    self.underlyingID = underlyingid;
    self.ID = id;
    self.type = type;
    self.attributes = attributes;
}

function koPosition(accountid, price, quantity, instrument, exchangeName, widget) {
    var self = this;
    self.accountID = new ko.observable(accountid);
    self.price = new ko.observable(price);
    self.quantity = new ko.observable(quantity);
    self.instrument = new ko.observable(instrument);
    self.widget = widget;

    self.displaySymbol = self.instrument.symbol;
    self.displaySide = self.quantity() > 0 ? "LONG" : "SHORT";
    self.displayQuantity = addCommas(widget.options.qtyAsLots ? self.quantity() / widget.options.lotSize : self.quantity(), 5);
    //   self.displayQuantity = self.quantity().toFixed(2);
    self.displayPrice = self.price().toFixed(5);
    self.exchangeName = exchangeName;
}

function koPositionSummary(price, quantity, symbol) {
    var self = this;
    self.price = new ko.observable(price);
    self.quantity = new ko.observable(quantity);
    self.symbol = new ko.observable(symbol);
    self.currentPrice = new ko.observable();
    self.allPositions = new ko.observableArray();
    self.selectedPosition = new ko.observable();

    self.showDetails = function (position) {
        if (self.selectedPosition() !== null) {
            self.selectedPosition(null);
            return;
        }
        self.selectedPosition(position);
    };

    // exposure = sum (price * quantity)
    self.exposure = ko.computed(function () {
        var exposure = 0;
        for (var i = 0; i < self.allPositions().length; i++) {
            var thisPos = self.allPositions()[i];
            exposure += thisPos.price() * thisPos.quantity();
        }
        return exposure.toFixed(2);
    });
}

(function ($) {
    $.widget("tsi.positionWidget",
            {
                _widgetRef: this,
                _exchangeList: getAllExchanges(),
                _positionWidgetModelObject: function (widget) {
                    var self = this;
                    self.myWidget = widget;
                    self.positionList = new ko.observableArray();

                    // Use pricing information to update exposure as necessary
                    self.handlePriceUpdate = function (message) {
                        var options = this.options;
                        var msgExchange = message.exchange;
                        //  var msgSymbol = message.symbol;
                        for (var i = 0; i < self.positionList().length; i++) { //  position list array
                            var thisSummary = self.positionList()[i];
                            for (var j = 0; j < thisSummary.allPositions().length; j++) { // items on each position list
                                var thisPosition = thisSummary.allPositions()[j];
                                if (thisPosition.instrument() !== null && thisPosition.instrument().exchangeID === msgExchange) {
                                    if (thisSummary.quantity() < 0) {
                                        thisSummary.currentPrice(Math.round(message.askPrice * 100) / 100);
                                    } else {
                                        thisSummary.currentPrice(Math.round(message.bidPrice * 100) / 100);
                                    }
                                }
                            }
                        }
                    };
                    // for DOM render
                    self.updatePositionList = function (positionList) {
                        var summaries = summarizePositions(positionList); // Reorder positions -> [{symbol, price, quantity, exchange, [POSITIONS per symbol]} ]
                        var seenSymbols = new Array();
                        var updatedPositions = new Array();
                        for (var summaryKey in summaries) {
                            var item = summaries[summaryKey];
                            var symbol = item.symbol;
                            var price = item.price.toFixed(2);
                            var quantity = addCommas(self.myWidget.options.qtyAsLots ? item.quantity / self.myWidget.options.lotSize : item.quantity, 5);
                            quantity = Math.round(quantity * 100) / 100;
                            var positionSummary = new koPositionSummary(price, quantity, symbol);

                            seenSymbols.push(symbol);

                            for (var i = 0; i < item.positions.length; i++) {
                                var thisPos = item.positions[i];
                                var thisInstrument = new koInstrument(thisPos.instrument.symbol, 
                                                                     thisPos.instrument.baseSymbol,
                                                                     thisPos.instrument.exchangeid, 
                                                                     thisPos.instrument.underlyingid,
                                                                     thisPos.instrument.id, 
                                                                     thisPos.instrument.type, 
                                                                     thisPos.instrument.attributes);
                                var thisExName = "N/A";
                                self.myWidget._exchangeList.forEach(function (exchange) {
                                    if (exchange.id === thisPos.instrument.exchangeid) {
                                        thisExName = exchange.description;
                                    }
                                });
                                positionSummary.allPositions.push(new koPosition(thisPos.accountid, thisPos.price, thisPos.quantity, thisInstrument, thisExName, self.myWidget));
                            }
                            updatedPositions.push(positionSummary);
                        }

                        // Remove any dead positions, updated any existing ones.
                        for (var j = 0; j < self.positionList().length; j++) {
                            var thisPosition = self.positionList()[j];
                            if (seenSymbols.indexOf(thisPosition.symbol()) === -1) {
                                self.positionList.remove(thisPosition);
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
                                        self.positionList.replace(thisPosition, thisUpdatedPosition);
                                    }
                                }
                            }
                        }

                        // Add any new positions
                        for (var l = 0; l < updatedPositions.length; l++) {
                            var thisUpdatedPosition = updatedPositions[l];
                            var found = false;
                            for (var m = 0; m < self.positionList().length; m++) {
                                if (self.positionList()[m].symbol() === thisUpdatedPosition.symbol()) {
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                self.positionList.push(thisUpdatedPosition);
                            }
                        }
                    };
                },
                // default settings
                options: {
                    showDetail: true, // whether we should allow drilldown from summary to details
                    selector: 'Positions', // override to set a different selector
                    showAdjustments: true, // Should we show adjustments made to this account and allow adding new ones
                    qtyAsLots: true, // Show quantity as lots
                    lotSize: 100000, // Size of a lot if using qtyAsLots
                    posdialogselector: 'adjustmentDialog',
                    accountChangeTopic: 'selectedAccount',
                    templateName: 'positionWidgetTemplate-tpl'
                },
                _initData: function () {
                    this.accountInfo = getAllAccounts();
                    this.companyInfo = loadAllUserInfo();
                    setEventSource();

                },
                /* create model */
                _createModel: function () {
                    var self = this;
                    this.positionWidgetModel = new this._positionWidgetModelObject(this);
                    var model = this.positionWidgetModel;

                    var positionList = getAccountPositions(self.options.account);  // call REST
                    model.updatePositionList(positionList); // update current list for show on DOM
                },
                // set up widget
                _create: function () {
                    PositionWidget = this;
                    var self = this;
                    var selector = self.options.selector;

                    $('#' + selector).attr("data-bind", "template: {name: '" + self.options.templateName + "'}");
                    self._initData();
                    self._createModel();
                    ko.applyBindings(self.positionWidgetModel, $('#' + selector)[0]);

                    // Start the position poller
                    self.subkey = positionPoller.subscribe(self.options.account,
                            function (positionList) {
                                //callback code, should rebuild the whole thing
                                self.positionWidgetModel.updatePositionList(positionList);
                            }
                    );

                    // Trap account changes
                    $.subscribe(self.options.accountChangeTopic, function (newValue) {
                        positionPoller.unsubscribe(PositionWidget.options.account, PositionWidget.subkey); // stop asking for data

                        // Load new Position list
                        self.positionWidgetModel.positionList.removeAll();
                        self.options.account = newValue;
                        self.positionWidgetModel.updatePositionList(getAccountPositions(newValue));

                        // Start new subscription
                        self.subkey = positionPoller.subscribe(self.options.account,
                                function (positionList) {
                                    //callback code, should rebuild the whole thing
                                    self.positionWidgetModel.updatePositionList(positionList);
                                }
                        );
                    });
                    $.subscribe("priceFeed", function (message) {
                        self.positionWidgetModel.handlePriceUpdate(message);
                    });
                },
                _displayAdjustments: function () {
                    this.adjustments = getAdjustments(this.options.account);
                    if (this.adjustments.length > 0) {
                        this.adjustments.sort(compareAdjustments);
                    }

                    var mySelector = this.options.selector;

                    var self = this;

                    // Don't recreate the header / event listener if we're here from a click event.
                    if ($('#' + mySelector + 'AdjustmentsRowSelectorRow').length < 1) {
                        $("<tr id='" + mySelector + "AdjustmentsRowSelectorRow'>" +
                            "<td id='" + mySelector + "AdjustmentsRowSelectorButton' class='ui-state-default ui-corner-all'>" +
                                "<span class='ui-icon ui-icon-arrowreturnthick-1-e'></span>\n\
                            </td colspan='3'>" +
                            "<td>Adjustments\n\
                            </td>\n\
                            <td class='ui-state-default ui-corner-all' id='" + mySelector + "AdjustmentsAddButton'>" +
                                <span class='ui-icon ui-icon-document'></span>"
                            "</td>"
                          "</tr>")
                                .appendTo('#' + mySelector + "Summary > tbody"); // show the header, expanded or not...
                        $('#' + mySelector + "AdjustmentsAddButton").click($.proxy(function () {
                            self._showAdjustmentDialog();
                        }));
                        $('#' + mySelector + "AdjustmentsRowSelectorButton").click($.proxy(function () {
                            if (!self.state.adjexpanded) {
                                self.state.adjexpanded = true;
                                self._displayAdjustments();
                            } else {
                                // Remove the row containing the adjustments table - will be recreated if we expand again.
                                $("td#" + self.options.selector + "AdjustmentsRow").parent().remove();
                                self.state.adjexpanded = false;
                            }
                        }, self));
                    }
                    if (self.state.adjexpanded) {
                        $("<tr><td colspan='4' id='" + mySelector + "AdjustmentsRow'></td></tr>").appendTo('#' + mySelector + "Summary > tbody");
                        $("<table id='" + mySelector + "Adjustments'><thead class='ui-widget-header'><th>Symbol</th><th>Px</th><th>Qty</th><th>Date</th><th>Desc</th></thead><tbody></tbody></table>")
                                .appendTo('#' + mySelector + "AdjustmentsRow");
                        self.adjustments.forEach(function (adjustment) {
                            var price = adjustment.price.toFixed(5);
                            //                    var quantity = addCommas(self.options.qtyAsLots ? adjustment.quantity/self.options.lotSize : adjustment.quantity,4);
                            var quantity = addCommas(self.options.qtyAsLots ? adjustment.quantity / self.options.lotSize : adjustment.quantity, 5);
                            var date = new Date(adjustment.adjtime);
                            var time = (date.getYear() + 1900) + "-" + (date.getMonth() + 1) + "-" + date.getDate();
                            $("<tr><td>" + adjustment.instrument.symbol + "</td><td>" + price + "</td><td  class='quantity'>" + quantity + "</td><td>" + time + "</td><td>" + adjustment.description + "</td></tr>")
                                    .appendTo('#' + mySelector + 'Adjustments > tbody');
                        });
                    }

                },
                _showAdjustmentDialog: function () {
                    var self = this;
                    $('#' + this.options.posdialogselector).dialog({title: "Add Adjustment", buttons: [
                            {
                                text: "Cancel",
                                click: function () {
                                    $(this).dialog("close");
                                    $('#' + self.options.posdialogselector + "> *").remove();
                                }
                            },
                            {
                                text: "Ok",
                                click: function () {
                                    $(this).dialog("close");
                                    var posAdj = {};
                                    var instid = $('#' + self.options.posdialogselector + "PosAdjForm [name='instrumentid']").val();
                                    var marketid = $('#' + self.options.posdialogselector + "PosAdjForm [name='marketid']").val();
                                    var mktinsts = getMarketInstruments(marketid);
                                    for (instKey in mktinsts) {
                                        var instrument = mktinsts[instKey];
                                        if (instrument.id == instid)
                                            posAdj.instrument = instrument;
                                    }
                                    posAdj.quantity = $('#' + self.options.posdialogselector + "PosAdjForm [name='quantity']").val() * self.options.lotSize;
                                    posAdj.price = $('#' + self.options.posdialogselector + "PosAdjForm [name='price']").val();
                                    posAdj.description = $('#' + self.options.posdialogselector + "PosAdjForm [name='description']").val();
                                    posAdj.accountid = $('#' + self.options.posdialogselector + "PosAdjForm [name='accountid']").val();
                                    var side = $('#' + self.options.posdialogselector + "PosAdjForm [name='side']").val();
                                    if (side == "SHORT") {
                                        posAdj.quantity = posAdj.quantity * -1.0;
                                    }
                                    savePositionAdjustment(posAdj);
                                    $('#' + self.options.posdialogselector + "> *").remove();
                                }
                            }
                        ]});
                    getAllAccounts();
                    $('#' + this.options.posdialogselector).append("<p><form id='" + this.options.posdialogselector + "PosAdjForm'>" +
                            "<table>" +
                            "<tr><td>Exchange:</td><td id='" + this.options.posdialogselector + "PosAdjPickExchange'></td></tr>" +
                            "<tr><td>Symbol:</td><td id='" + this.options.posdialogselector + "PosAdjPickInstrument'></td></tr>" +
                            "<tr><td>Price:</td><td><input type='number' name='price' default='0' size='8'/></td></tr>" +
                            "<tr><td>Quantity (lots):</td><td><input type='number' name='quantity' size='8'/></td></tr>" +
                            "<tr><td>Side:</td><td><select name='side'><option>SHORT</option><option>LONG</option></side></td></tr>" +
                            "<tr><td colspan='2'><textarea name='description'></textarea></td></tr>" +
                            "</table>" +
                            "<input type='hidden' name='accountid' value='" + this.options.account + "'/>" +
                            //        			"<input type='hidden' name='instrument' value=''/>" +
                            "</form></p>");
                    var self = this;
                    $('#' + this.options.posdialogselector + "PosAdjPickExchange").accountMarketSelector({
                        selector: this.options.posdialogselector + "PosAdjPickExchange",
                        accountid: this.options.account,
                        handler: function () {
                            self._showMarketSymbolSelector($(this).val());
                        }
                    });
                    var marketid = $('#' + self.options.posdialogselector + "PosAdjForm [name='marketid']").val();
                    this._showMarketSymbolSelector(marketid);
                },
                // display the market symbol selector for the given market id
                _showMarketSymbolSelector: function (marketid) {
                    $('#' + this.options.posdialogselector + "PosAdjPickInstrument").marketSymbolSelector({
                        selector: this.options.posdialogselector + "PosAdjPickInstrument",
                        marketid: marketid,
                        handler: null
                    });
                },
                // respond to changes in options
                _setOption: function (key, value) {
                },
                //destroy widget
                _destroy: function () {
                    this.state = {};
                    positionPoller.unsubscribe(this.options.account, this.subkey); // stop asking for data
                    $('#' + this.options.selector + 'Summary').remove(); // remove UI elements
                }
            }
    );
}(jQuery));

//NOTE: not sure really what to sort these on!
function comparePositions(a, b) {
    if (a.instrument.symbol < b.instrument.symbol)
        return -1;
    if (a.instrument.symbol > b.instrument.symbol)
        return 1;
    return 0;
}

function compareAdjustments(a, b) {
    if (a.adjtime < b.adjtime)
        return -1;
    if (a.adjtime > b.adjtime)
        return 1;
    return 0;
};