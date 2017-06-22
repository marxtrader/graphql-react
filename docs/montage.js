    var MontageWidget;

    function koWatchlist(name, id, map, groupId, list, symbols, companyId, ownerId, instrumentIds, widget) {
        
        var self = this;
        self.name = ko.observable(name);
        self.id = ko.observable(id);
        self.map = ko.observableArray(map[1]);
        self.groupId = ko.observable(groupId);
        self.list = ko.observable(list);
        self.symbols = ko.observableArray(symbols);
        self.companyId = ko.observable(companyId);
        self.ownerId = ko.observable(ownerId);
        self.instrumentIds = ko.observableArray(instrumentIds);
        self.widget = widget;
        
        self.subs = new Array();
        self.subRoutes = {};

        self.selectedSymbol = new ko.observable();
        self.orderFormOrderType = ko.observable();
        self.orderFormDestination = ko.observable();
        self.orderFormQuantity = ko.observable();
        self.orderFormLimitPrice = ko.observable();
        self.orderFormStopPrice = ko.observable();
        self.orderFormTrailingStopPrice = ko.observable();
        self.orderFormExpiration = ko.observable();
        self.orderFormSide = ko.observable();

        // adding instrument to WatchList (adding map, symbols, list, instrumentIds)
        self.addInstrument = function() {
            // don't add instrument if already on the watchlist
            var match = false;
            if (self.map === null || self.map() === null) {
                self.map = ko.observableArray();
            }
            for (var hh = 0; hh < self.map().length; hh++) {
                if (widget.priceWidgetModel.selectedRoute().route.routeJSON === self.map()[hh].routeString && widget.priceWidgetModel.selectedInstrument().id === self.map()[hh].instrumentID) {
                    match = true;
                    return;
                }
            }

            if (!match) {
                self.map.push({instrumentID: widget.priceWidgetModel.selectedInstrument().id, 
                               routeString: widget.priceWidgetModel.selectedRoute().route.routeJSON, 
                               symbol: widget.priceWidgetModel.selectedInstrument().symbol, 
                               bidPrice: new ko.observable(0), 
                               askPrice: new ko.observable(0), 
                               bidExchange: new ko.observable(-1), 
                               askExchange: new ko.observable(-1), 
                               bidSize: new ko.observable(0), 
                               askSize: new ko.observable(0)});
                //self.map.push({instrumentID: widget.priceWidgetModel.selectedInstrument().id, routeString: widget.priceWidgetModel.selectedRoute().route.routeJSON, symbol: widget.priceWidgetModel.selectedInstrument().symbol, bid: new ko.observable(0), ask: new ko.observable(0)});

// start testing  
                if (typeof self.list() !== "undefined"){
                    self.list(self.list() + (self.list() === "" ? "" : "^") + widget.priceWidgetModel.selectedInstrument().id + "|" + widget.priceWidgetModel.selectedInstrument().symbol + "|" + widget.priceWidgetModel.selectedRoute().route.routeJSON);
                }else{
                    self.list(widget.priceWidgetModel.selectedInstrument().id + "|" + widget.priceWidgetModel.selectedInstrument().symbol + "|" + widget.priceWidgetModel.selectedRoute().route.routeJSON);
                }
// end testing         

                if (self.symbols === null) {
                    self.symbols = ko.observableArray();
                }
                else {
                    self.symbols.push(widget.priceWidgetModel.selectedInstrument().symbol);
                }
                if (self.instrumentIds === null) {
                    self.instrumentIds = ko.observableArray();
                }
                else {
                    self.instrumentIds.push(widget.priceWidgetModel.selectedInstrument().id);
                }

                var sub = new SubscriptionKey(widget.priceWidgetModel.selectedInstrument().symbol, 
                                             widget.priceWidgetModel.selectedRoute().route.marketid, 
                                             widget.priceWidgetModel.selectedInstrument().subKey.carrier, 
                                             widget.priceWidgetModel.selectedInstrument().subKey.supplier, 
                                             "FOREXLEVEL1");
                subscribe(sub);

                var wl = {};
                wl.name = self.name();
                wl.id = self.id();
                wl.map = self.map;
                wl.groupId = self.groupId;
                wl.list = self.list();
                wl.symbols = self.symbols;
                wl.companyId = self.companyId();
                wl.ownerId = self.ownerId();
                wl.instrumentIds = self.instrumentIds;

                // remove generated fields before submitting.
                delete wl.groupId;
                delete wl.map; 
                delete wl.symbols;
                delete wl.instrumentIds;

                //saves Watchlist
                useUserService().saveWatchList({$entity: wl}); // REST PUT

                //loads symbols tab
                $('#watchlistTabs a[href="#detailsTab"]').tab('show');
            }
        };

        // remove instrument from WatchList
        // remove from: map, symbols, instrumentIds, list        
        self.removeInstrument = function(mapEntry) {
            
            // removing on client side
            for (var jj = 0; jj < self.map().length; jj++) {
                if (mapEntry.routeString === self.map()[jj].routeString && mapEntry.instrumentID === self.map()[jj].instrumentID) {

                    self.map.remove(mapEntry);
                    self.symbols.splice(jj, 1);
                    self.instrumentIds.splice(jj, 1);

                    self.list("");
                    var myRouteVar = "";
                    for (var kk = 0; kk < self.map().length; kk++) {
                        if (self.map()[kk].foundRoute !== null) {
                            myRouteVar = self.map()[kk].foundRoute.routeJSON;
                        } else {
                            myRouteVar = self.map()[kk].routeString;
                        }
                        self.list(self.list() + (self.list() === "" ? "" : "^") + self.instrumentIds()[kk] + "|" + self.symbols()[kk] + "|" + myRouteVar);
                    }
                    if (self.list() !== "") {
                        self.list().substring(1);
                    }
                }
            }
            var wl = {};
            wl.name = self.name();
            wl.id = self.id();
            wl.map = self.map;
            wl.groupId = self.groupId;
            wl.list = self.list();
            wl.symbols = self.symbols;
            wl.companyId = self.companyId();
            wl.ownerId = self.ownerId();
            wl.instrumentIds = self.instrumentIds;

            // remove generated fields before submitting.
            delete wl.groupId;
            delete wl.map;
            delete wl.symbols;
            delete wl.instrumentIds;

            // removing on server side (saving Watchlist with new data)
            useUserService().saveWatchList({$entity: wl}); // REST PUT
        };

        // GET SYMBOL DETAILS  (onClick Symbol row)
        self.selectSymbolHandler = function(symbol, event) {
         
            if (self.selectedSymbol() === symbol) {
                return;
            }

            // unsubscribe
if (typeof self.selectedSymbol() !== "undefined"){  // added
            if (self.selectedSymbol() !== null) {
                var oldSymbol = self.selectedSymbol();
                var oldL2Sub = new SubscriptionKey(oldSymbol.symbol, oldSymbol.foundRoute.marketid, oldSymbol.foundRoute.carrier, oldSymbol.foundRoute.supplier, "FOREXLEVEL2");
                unsubscribe(oldL2Sub);
            }
}   

//symbol.foundRoute = $.parseJSON(symbol.routeString);  // added
            // subscribe
            self.selectedSymbol(symbol);
            var L2sub = new SubscriptionKey(symbol.symbol, symbol.foundRoute.marketid, symbol.foundRoute.carrier, symbol.foundRoute.supplier, "FOREXLEVEL2");
            subscribe(L2sub);

            $(event.currentTarget).parent().children('.orderFormStyle').removeClass('orderFormStyle');
            $(event.currentTarget).addClass('orderFormStyle');
            $('#selectedSymbolDetails').addClass("orderFormStyle");
        };  // END OF selectSymbolHandler
              
              
        /* SAVE ORDER DETAILS (SELL OR BUY) */
        self.placeOrderHandler = function(symbol, button) {             
            var selectedInst = self.selectedSymbol().instrument;

            var instrumentToSubmit = {
                "attributes": selectedInst.attributes,
                "baseSymbol": selectedInst.baseSymbol,
                "exchangeid": selectedInst.exchangeid,
                "id": selectedInst.id,
                "symbol": selectedInst.symbol,
                "type": selectedInst.type,
                "underlyingid": selectedInst.underlyingid
            };

            self.orderFormSide = (button.target.id === 'buyBtn') ? "BUY" : "SELL";
            var qtyConvert = parseInt(self.orderFormQuantity());
            if (self.widget.priceWidgetModel.selectedAccount() === undefined) {
                $.publish("eventLog", ["Can't place order - account unavailable."]);
                return;
            }
            if (qtyConvert === 0) {
                $.publish("eventLog", ["Can't place order - 0 quantity."]);
                return;
            }

            var orderToSubmit = {
                "id": null,
                "state": null,
                "type": self.orderFormOrderType(),
                "offset": self.orderFormTrailingStopPrice(),
                "side": self.orderFormSide,
                "groupId": self.groupId(),
                "notes": null,
                "companyId": self.companyId(),
                "ownerId": self.ownerId(),
                "creationTime": (+new Date),
                "quantity": qtyConvert,
                "instrument": instrumentToSubmit,
                "relatedOrderId": 0,
                "accountId": self.widget.priceWidgetModel.selectedAccount(),
                "destinationId": self.orderFormDestination().id,
                "expireTime": 0,
                "market": selectedInst.exchangeid,
                "orderId": null,
                "price": (self.orderFormOrderType() === "LIMIT" || self.orderFormOrderType() === "STOP_LIMIT") ? self.orderFormLimitPrice() : null,
                "ticketId": null,
                "tif": self.orderFormExpiration(),
                "dispQty": 0,
                "stopPrice": (self.orderFormOrderType() === "STOP" || self.orderFormOrderType() === "STOP_LIMIT") ? self.orderFormStopPrice() : null,
                "lastState": null,
                "capacity": "AGENCY",
                "cpOrderId": null,
                "avgprice": null,
                "cumqty": 0,
                "leavesqty": 0,
                "aon": false,
                "custOrderId": createUUID(),
                "execInst": null,
                "relatedClOrdId": null,
                "quoteId": null
            };

            useOrderService().placeOrder({$entity: orderToSubmit}); // REST CALL
            self.orderFormLimitPrice(null);
            self.orderFormStopPrice(null);
            self.orderFormLimitPrice(null);
            self.orderFormTrailingStopPrice(null);
        }; // end placeOrderHandler

        //
        self.orderDestinationsList = ko.computed(function() {
            if (self.selectedSymbol() === undefined) {
                return [];
            }
            var destinationDropdown = new Array();
            var route = $.parseJSON(self.selectedSymbol().routeString);
            for (var m = 0; m < widget.priceWidgetModel.listOfDestinations.length; m++) {
                var dest = widget.priceWidgetModel.listOfDestinations[m];
                var markets = dest.info.markets;
                if (typeof markets === 'undefined' || markets === null) {
                    return [];
                } else {
                    for (var n = 0; n < markets.length; n++) {
                        var insideMarkets = markets[n];
                        if (insideMarkets.marketid == route.marketid && insideMarkets.accountIds.indexOf(self.widget.priceWidgetModel.selectedAccount()) !== -1) {
                            destinationDropdown.push(dest);
                        }
                    }
                }
            }
            return destinationDropdown;
        }); // end of orderDestinationsList

        //
        self.orderTypesList = ko.computed(function() {
            if (self.selectedSymbol() == undefined || self.orderDestinationsList() == undefined || self.orderFormDestination() == undefined) {
                return [];
            }
            var typeList = new Array();
            var route = $.parseJSON(self.selectedSymbol().routeString);
            var markets = self.orderFormDestination().info.markets;
            if (markets == undefined || markets == null) {
                return [];
            } else {
                for (var n = 0; n < markets.length; n++) {
                    var insideMarkets = markets[n];
                    if (insideMarkets.marketid == route.marketid) {
                        for (var p = 0; p < insideMarkets.ordertypes.length; p++) {
                            typeList.push(ordTypes[insideMarkets.ordertypes[p]]);
                        }
                    }
                }
            }
            return typeList;
        });
        
        // 
        self.orderSidesList = ko.computed(function() {
            if (self.selectedSymbol() == undefined || self.orderDestinationsList() == undefined || self.orderFormDestination() == undefined) {
                return [];
            }
            var sideList = new Array();
            var route = $.parseJSON(self.selectedSymbol().routeString);
            var markets = self.orderFormDestination().info.markets;
            if (markets == undefined || markets == null) {
                return [];
            } else {
                for (var r = 0; r < markets.length; r++) {
                    var insideMarkets = markets[r];
                    if (insideMarkets.marketid == route.marketid) {
                        var canBuy = false;
                        var canSell = false;
                        for (var q = 0; q < insideMarkets.sides.length; q++) {
                            if (ordSides[insideMarkets.sides[q]] == "BUY") {
                                canBuy = true;
                            }
                            if (ordSides[insideMarkets.sides[q]] == "SELL") {
                                canSell = true;
                            }
                            sideList.push(ordSides[insideMarkets.sides[q]]);
                        }
                        if (canBuy == false) {
                            $('#buyBtn').addClass("disabled");
                        }
                        if (canSell == false) {
                            $('#sellBtn').addClass("disabled");
                        }
                    }
                }
            }
            return sideList;
        });
        self.orderTifsList = ko.computed(function() {
            if (self.selectedSymbol() == undefined || self.orderDestinationsList() == undefined || self.orderFormDestination() == undefined) {
                return [];
            }
            var sideList = new Array();
            var route = $.parseJSON(self.selectedSymbol().routeString);
            var markets = self.orderFormDestination().info.markets;
            if (markets == undefined || markets == null) {
                return [];
            } else {
                for (var s = 0; s < markets.length; s++) {
                    var insideMarkets = markets[s];
                    if (insideMarkets.marketid == route.marketid) {
                        for (var t = 0; t < insideMarkets.tifs.length; t++) {
                            sideList.push(ordTIFs[insideMarkets.tifs[t]]);
                        }
                    }
                }
            }
            return sideList;
        });

        self.cancelOrder = function(order, event) {
            // Unsub L2
            var oldSymbol = self.selectedSymbol();
            var oldL2Sub = new SubscriptionKey(oldSymbol.symbol, oldSymbol.foundRoute.marketid, oldSymbol.foundRoute.carrier, oldSymbol.foundRoute.supplier, "FOREXLEVEL2");
            unsubscribe(oldL2Sub);

            // Close form
            $(event.currentTarget).parent().children('.orderFormStyle').removeClass('orderFormStyle');
            self.selectedSymbol(null);
        };
    }

    var origin = document.domain;
    function sendPlaceHolder(symbol, sub, model) {
        var placeholder = {};
        placeholder.subKey = JSON.stringify(sub);
        placeholder.symbol = symbol;
        placeholder.bidPrice = 0.0;
        placeholder.bidSize = 0;
        placeholder.bidExchange = -1;
        placeholder.askPrice = 0.0;
        placeholder.askSize = 0;
        placeholder.askExchange = -1;
        model.watchListHandleTick(placeholder);
    };


    
    (function($) {
        $.widget("tsi.priceWidget",
                {
                    _widgetRef: this,
                    // remember watchlists for directing incoming updates.
                    renderWatchLists: new Array(), // this may not have any point now, this was basically doing what the model was doing before
                    allSubscriptions: new Array(),
                    allSubHistory: new Array(), // to store historical data for sparklines

                    _priceWidgetModelObject: function(widget) {
                        var self = this;
                        self.myWidget = widget;
                        self.tickArray = ko.observableArray();
                        self.listOfWatchlists = ko.observableArray();
                        self.selectedWatchlist = ko.observable();
                        self.selectedRoute = ko.observable();
                        self.listOfRoutes = ko.observableArray();
                        self.listOfInstruments = ko.observableArray();
                        self.selectedInstrument = ko.observable();
                        self.newWatchlistName = ko.observable();
                        self.orderTypes = ko.observableArray([{name: 'Market', value: 'MARKET'}, {name: 'Limit', value: 'LIMIT'}, {name: 'Stop', value: 'STOP'}, {name: 'Stop-Limit', value: 'STOP_LIMIT'}]);
                        self.orderTIFs = ko.observableArray([{name: "Good Till Day", value: "DAY"}, {name: "Good Till Cancel", value: "GOOD_TILL_CANCEL"}, {name: "At the Opening", value: "AT_THE_OPENING"}, {name: "Immediate or Cancel", value: "IMMEDIATE_OR_CANCEL"}, {name: "Fill or Kill", value: "FILL_OR_KILL"}, {name: "Good Till Crossing", value: "GOOD_TILL_CROSSING"}, {name: "Good Till Date", value: "GOOD_TILL_DATE"}, {name: "At the Close", value: "AT_THE_CLOSE"}]);
                        self.listOfDestinations = [];
                        
                        self.selectedAccount = ko.observable();

                        self.buySideL2 = ko.observableArray();
                        self.sellSideL2 = ko.observableArray();
                        
                        self.displayBuyL2 = ko.computed(function() {
                            if (self.selectedWatchlist() == null || self.selectedWatchlist().selectedSymbol() === null) { return; }
                            var selectedL2 = new Array();
                            var selectedSymbol = self.selectedWatchlist().selectedSymbol().symbol;
                            for (var i = 0; i < self.buySideL2().length; i++) {
                                var thisTick = self.buySideL2()[i];
                                if (thisTick.symbol == selectedSymbol) {
                                    selectedL2.push(thisTick);
                                }
                            }
                            return selectedL2;
                        });
                        
                        self.displaySellL2 = ko.computed(function() {
                            if (self.selectedWatchlist() == null || self.selectedWatchlist().selectedSymbol() == null) { return; }
                            var selectedL2 = new Array();
                            var selectedSymbol = self.selectedWatchlist().selectedSymbol().symbol;
                            for (var i = 0; i < self.sellSideL2().length; i++) {
                                var thisTick = self.sellSideL2()[i];
                                if (thisTick.symbol == selectedSymbol) {
                                    selectedL2.push(thisTick);
                                }
                            }
                            return selectedL2;
                        });

                        self.watchListHandleTick = function(message) {
                          //  var lastSparkRefresh = [];
                            var allSubIndex = 0;
                            if (widget.allSubscriptions.indexOf(message.subKey) != -1) {
                                allSubIndex = widget.allSubscriptions.indexOf(message.subKey);
                            } else {
                                allSubscriptions.push(message.subKey);
                                allSubIndex = widget.allSubscriptions.indexOf(message.subKey);
                            }

                            // initialize history array if needed
                            if (widget.allSubHistory[allSubIndex] == undefined) {
                                widget.allSubHistory[allSubIndex] = [];
                            }

                            // Put update info into a template table row.
                            var decimals = 5;
                            if (message.symbol.indexOf("JPY") != -1) {
                                decimals = 3;
                            }

                            var newBid = message.bidPrice.toFixed(decimals);
                            var newAsk = message.askPrice.toFixed(decimals);

                            var prices = {
                                "bid": message.bidPrice,
                                "ask": message.askPrice
                            };
                            if (widget.allSubHistory[allSubIndex].length > 49) { // cap at 100 points for now
                                widget.allSubHistory[allSubIndex].shift();
                            }
                            widget.allSubHistory[allSubIndex].push(prices);

                            var bidArray = [];
                            var askArray = [];
                            var thisMin = 0;
                            var thisMax = 0;
                            for (var i = 0; i < widget.allSubHistory[allSubIndex].length; i++) {
                                var thisBid = widget.allSubHistory[allSubIndex][i].bid;
                                var thisAsk = widget.allSubHistory[allSubIndex][i].ask;

                                if (thisMin == 0) {
                                    thisMin = (thisAsk < thisBid) ? thisAsk : thisBid;
                                } else {
                                    thisMin = (thisBid < thisMin) ? thisBid : thisMin;
                                    thisMin = (thisAsk < thisMin) ? thisAsk : thisMin;
                                }
                                if (thisMax == 0) {
                                    thisMax = (thisAsk > thisBid) ? thisAsk : thisBid;
                                } else {
                                    thisMax = (thisBid > thisMax) ? thisBid : thisMax;
                                    thisMax = (thisAsk > thisMax) ? thisAsk : thisMax;
                                }
                                bidArray.push(thisBid);
                                askArray.push(thisAsk);
                            }

                            for (var j = 0; j < self.listOfWatchlists().length; j++) {
                                var WL = self.listOfWatchlists()[j];
                                for (var n = 0; n < WL.map().length; n++) {
                                    var mapOfWL = WL.map()[n];
                                    var myStringObject = JSON.parse(message.subKey);

                                    if (mapOfWL.bidPrice == undefined || mapOfWL.askPrice == undefined) {
                                        mapOfWL.bidPrice = new ko.observable();
                                        mapOfWL.bidExchange = new ko.observable();
                                        mapOfWL.bidSize = new ko.observable();
                                        mapOfWL.askPrice = new ko.observable();
                                        mapOfWL.askExchange = new ko.observable();
                                        mapOfWL.askSize = new ko.observable();
                                    }

                                    if (mapOfWL.foundRoute != undefined && mapOfWL.symbol == myStringObject.symbol && mapOfWL.foundRoute.carrier == myStringObject.carrier && mapOfWL.foundRoute.marketid == myStringObject.market && mapOfWL.foundRoute.level == myStringObject.level && mapOfWL.foundRoute.supplier == myStringObject.supplier) {
                                        mapOfWL.bidPrice(newBid);
                                        mapOfWL.bidExchange(message.bidExchange);
                                        mapOfWL.bidSize(message.bidSize);
                                        mapOfWL.askPrice(newAsk);
                                        mapOfWL.askExchange(message.askExchange);
                                        mapOfWL.askSize(message.askSize);
                                    } else {
                                        continue;
                                    }
                                }
                            }
                        };                        
                        
                        // All L2 ticks are price-indexed by the feeder, so "ADD" on the same price is effectively a replace.
                        self.watchListHandleL2 = function(message) {
                            var tick = message;
                            if (tick.price == 0) {
                                // Market order for some reason, skip this tick.
                                return;
                            }
                            var updateArray = null;
                            if (tick.side == "SELL") {
                                updateArray = self.sellSideL2;
                            } else {
                                updateArray = self.buySideL2;
                            }
                            var currentEntry = ko.utils.arrayFilter(updateArray(), function(priceLevel) {
                                return priceLevel.price == message.price;
                            });
                            if (tick.action == "ADD") {                                
                                if (currentEntry.length == 0) {
                                    updateArray.push(tick);
                                } else {
                                    if (tick.date > currentEntry[0].date) {
                                        updateArray.replace(currentEntry[0], tick);
                                    }
                                }                               
                            } else if (tick.action == "DELETE" && tick.date > currentEntry[0].date) {
                                if (currentEntry.length > 0) {
                                    updateArray.remove(currentEntry[0]);
                                }
                            }
                        };

                        self.createWatchlist = function() {
                            if (!self.newWatchlistName() || self.newWatchlistName() == "") {
                                return alert("Please enter the name for your new watchlist");
                            }
                            var newWatchlist = new koWatchlist(self.newWatchlistName(), 0, [], userInfo.groupId, "", null, userInfo.companyId, userInfo.id, null, self.myWidget);
                            self.listOfWatchlists.push(newWatchlist);
                            self.selectedWatchlist(newWatchlist);

                            var wl = {};
                            wl.name = newWatchlist.name();
                            wl.id = newWatchlist.id();
                            wl.list = newWatchlist.list();
                            wl.companyId = newWatchlist.companyId();
                            wl.ownerId = newWatchlist.ownerId();

                            // save watchlist
                            var newID = useUserService().saveWatchList({$entity: wl}); // using REST for save to db
                            self.selectedWatchlist().id(newID);
                        }

                        self.removeWatchlist = function() {
//                            if (watchlist.ownerId != userInfo.id) {
//                                return; // Don't bother trying to delete something you don't own
//                            }

                            var wl = {};
                            wl.name = self.selectedWatchlist().name();
                            wl.id = self.selectedWatchlist().id();
                            wl.list = self.selectedWatchlist().list();
                            wl.companyId = userInfo.companyId;
                            wl.ownerId = self.selectedWatchlist().ownerId();
                            useUserService().deleteWatchList({$entity: wl});

                            for (var ss = 0; ss < self.listOfWatchlists().length; ss++) {
                                var match = self.listOfWatchlists()[ss];
                                if (self.selectedWatchlist().id == match.id) {
                                    self.listOfWatchlists.remove(match);
                                }
                            }

                            if (self.listOfWatchlists().length > 0) {
                                self.selectedWatchlist(self.listOfWatchlists()[0]);
                            };
                        };

                        self.setSelectedWatchlist = function() {
                            self.selectedWatchlist(this);
                        };

                        self.setSelectedRoute = function() {
                            self.selectedRoute(this);
                        };
                    },
                    // default settings
                    options: {
                        selector: 'client', // override to set a different selector
                        accountChangeTopic: 'selectedAccount' 
                    },
                    _initData: function() {
                        var self = this;
                        loadUserInfo();
                        loadRouteInfo(); // marketdata core
                        connectData(); // marketdata feeder
                    },
                    /* create model */
                    _createModel: function() {
                        this.priceWidgetModel = new this._priceWidgetModelObject(this);
                        var model = this.priceWidgetModel;
                        
                         // Pick up account changes.
                        $.subscribe(this.options.accountChangeTopic, function(newValue) {
                           model.selectedAccount(newValue);
                        });
                        
                        // Try to pick up the default account from the blotter if it's in the same page.
                        if (model.selectedAccount() == null && BlotterWidget) {
                            model.selectedAccount(BlotterWidget.blotterWidgetModel.selectedAccount().id());
                        }

                        // See if the user has any watchlists...
                        var watchlists = useUserService().getWatchListIds();  // REST
                   
                        var myRole = useOrderService().getPrimaryRole(); // REST
                        // Build an instrument list from any watchlists returned...
                        var i = 0;
                        var instruments = new Array();
                        for (var watchlistKey in watchlists) {
                            var wl = watchlists[watchlistKey].split("|");
                            var wlID = wl[0];
                            var watchlistSymbols = useUserService().getWatchList({ // REST
                                "id": wlID
                            });
                            if (myRole == "trader" && watchlistSymbols.ownerId != userInfo.id) {
                                continue; // skip this if we're a trader and don't own the watchlist
                            }
   
   
                            if (watchlistSymbols != undefined) {
                                // get object from watchlistSymbols.map 
                                var symbolsAsArray = watchlistSymbols.map[1]; // array of objects  
                                var i;
                                for (i = 0; i < symbolsAsArray.length; ++i){
                                    
                                    var thisEntry = symbolsAsArray[i];
                                    if (thisEntry.routeString != undefined && thisEntry.routeString != "undefined" && thisEntry.routeString != "") {
                                        thisEntry.foundRoute = JSON.parse(thisEntry.routeString);
                                    }
                                    instruments[i++] = thisEntry.instrumentID; 
                                }
                                

                                /* old variant
                                for (var mapKey in watchlistSymbols.map) {
                                    var thisEntry = watchlistSymbols.map[mapKey];
                                    if (thisEntry.routeString != undefined && thisEntry.routeString != "undefined" && thisEntry.routeString != "") {
                                        thisEntry.foundRoute = JSON.parse(thisEntry.routeString);
                                    }
                                    instruments[i++] = thisEntry.instrumentID;
                                }*/
                            }

                            var newWatchlist = new koWatchlist(watchlistSymbols.name, 
                                                              watchlistSymbols.id, 
                                                              watchlistSymbols.map, 
                                                              watchlistSymbols.groupId, 
                                                              watchlistSymbols.list, 
                                                              watchlistSymbols.symbols, 
                                                              watchlistSymbols.companyId, 
                                                              watchlistSymbols.ownerId, 
                                                              watchlistSymbols.instrumentIds, 
                                                              this);
                            model.listOfWatchlists.push(newWatchlist);
                            model.listOfWatchlists.sort(function(a, b) {
                                return a.name() == b.name() ? 0 : (a.name() < b.name() ? -1 : 1)
                            });
                        }
                        model.selectedWatchlist(model.listOfWatchlists()[0]);

                        // remove dupe instruments
                        var cleanInstruments = instruments.filter(function(elem, pos) {
                            return instruments.indexOf(elem) == pos;
                        });


                        // This loop just makes SURE that all instruments in the watchlist actually have a route that we can subscribe to.
                        if (instruments.length > 0) {
                            // Load any instruments from watchlists we found
                            var rawInstrumentList = useMarketDataService().getInstruments({
                                $entity: cleanInstruments
                            });

                            var instrumentList = rawInstrumentList.filter(function(elem, pos) {
                                return elem != null;
                            });

                            // Try to figure out if these instruments have a route...
                            for (var instKey in instrumentList) {
                                var thisInstrument = instrumentList[instKey];
                                // Convert routes into subscription keys and subscribe.
                                var routes = getAllRoutes();
                                for (var routeKey in routes )  {
                                    var thisRoute = routes[routeKey];
                                    // If this route matches one of our missing instruments, find the one missing a route in the watchlist and add this route.
                                    if ($.inArray(thisInstrument, thisRoute.instruments) && thisRoute.marketid == thisInstrument.exchangeid) {
                                        ko.utils.arrayForEach(this.priceWidgetModel.listOfWatchlists(), function(thisWL) {
                                            for (var thisMapKey in thisWL.map()) { // fix this stuff as necessary
                                                var thisMapEntry = thisWL.map()[thisMapKey];                                                
                                                if (thisMapEntry.instrumentID == thisInstrument.id) {
                                                    if (thisMapEntry.instrument == undefined) {                                                        
                                                        thisMapEntry.instrument = thisInstrument;
                                                    }
                                                    if (thisMapEntry.foundRoute == undefined) {
                                                        thisMapEntry.foundRoute = thisRoute;
                                                    }
                                                }
                                            }
                                        });
                                    }
                                }
                            }
                        }

                        // Subscribe if we have routes.
                        ko.utils.arrayForEach(this.priceWidgetModel.listOfWatchlists(), function(thisRWL) {

                            for (var thisRMapKey in thisRWL.map()) {
                                var thisRMapEntry = thisRWL.map()[thisRMapKey];
                                thisRMapEntry.bid = new ko.observable(0);
                                thisRMapEntry.ask = new ko.observable(0);
                                if (thisRMapEntry.foundRoute === undefined) {
                                    var symbol = thisRMapEntry.symbol;
                                    var sub = new SubscriptionKey(symbol, 0, "N/A", "N/A", 12);
                                    // Pass "Root" Model to sendPlaceHolder
                                    sendPlaceHolder(symbol, sub, model);
                                    $("#logContent").append("No permitted routes found for symbol " + thisRMapEntry.symbol + " - routeString: " + thisRMapEntry.routeString + "<br/>");
                                } else {
                                    var thisRWLRoute = thisRMapEntry.foundRoute;
                                    var symbol = thisRMapEntry.symbol;
                                    var sub = new SubscriptionKey(symbol, thisRWLRoute.marketid, thisRWLRoute.carrier, thisRWLRoute.supplier, thisRWLRoute.level);
                                    subscribe(sub);
                                    thisRWL.subs.push(sub);
                                    thisRWL.subRoutes[JSON.stringify(sub)] = thisRWLRoute;

                                    // Pass "Root" Model to sendPlaceHolder
                                    sendPlaceHolder(symbol, sub, model);
                                }
                            }
                        });

                        // Subscribe to the "priceFeed" event stream and callback to the model to update on a new message
                        $.subscribe("priceFeed", function(message) {
                            model.watchListHandleTick(message);
                        });
                        $.subscribe("priceL2Feed", function(message) {
                            model.watchListHandleL2(message);
                        });

                        // Populate routes and instruments dropdowns
                        var routes1 = getAllRoutes();
                        for (var k = 0; k < routes1.length; k++) {
                            var thisRoute = routes1[k];
                            model.listOfRoutes.push({"name": thisRoute.marketName + ' [' + thisRoute.marketid + '] via' + ' [' + thisRoute.supplier + ']', "route": thisRoute});
                            var instr = thisRoute.instruments[0];
                            instr.sort(function(a, b) {
                                return a.symbol === b.symbol ? 0 : (a.symbol < b.symbol ? -1 : 1)
                            });
                            for (var g = 0; g < instr.length; g++) {
                                model.listOfInstruments.push(instr[g].symbol);
                            }
                        }
                        model.listOfRoutes.sort(function(a, b) {
                            return a.name == b.name ? 0 : (a.name < b.name ? -1 : 1)
                        });
                        model.selectedRoute(model.listOfRoutes()[0]);

                        // Build master list of Destinations
                        model.listOfDestinations = getAllDestinations();

                    },
                    // set up widget
                    _create: function() {
                        var selector = this.options.selector;
                        $('#' + selector).attr("data-bind", "template: {name: 'priceWidgetTemplate-tpl'}");
                        this._initData();
                        this._createModel();
                        ko.applyBindings(this.priceWidgetModel, $('#' + selector)[0]);
                        MontageWidget = this;
                    },
                    // respond to changes in options
                    _setOption: function(key, value) {
                        $.Widget.prototype._setOption.apply(this, arguments);
                    },
                    //destroy widget
                    _destroy: function() {
                        $('#' + this.options.selector).remove(); // remove UI elements
                    }
                });
    }(jQuery));

    $(document).ready(function() {

        // attach feedview widget to client div.
        $('#feedView').priceWidget({selector: 'feedView'});
    });