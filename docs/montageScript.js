<!--  export old script to  file clientMontage.js -->
<script type="text/javascript" src="/client/clientMontage.js"></script>  

<script type="text/html" id="priceWidgetTemplate-tpl">
    <div class="panel panel-default">
        <div class="panel-heading">
            <!-- ko if: listOfWatchlists() != undefined && listOfWatchlists().length > 0 -->
            <div class="input-group">
                <span class="input-group-addon">Watchlist: </span>
                <select name="chooseWatchlist" class="form-control" data-bind="options: listOfWatchlists, value: selectedWatchlist, optionsText: 'name'"></select>
            </div>          
            <!-- /ko -->

            <!-- ko if: listOfWatchlists == undefined || listOfWatchlists().length == 0 -->
            No watchlists. Please create one.
            <!-- /ko -->
        </div>

        <div class="panel-body">    
            <!-- ko if: listOfWatchlists == undefined || listOfWatchlists().length == 0 -->
                    <form role="form">
            
                                    <div class="form-group">
                            <label for="exampleInputPassword1">New Watchlist:</label>
                            <div class="input-group">
                                <input type="text" class="form-control" id="newWatchlist" data-bind="value: newWatchlistName">
                                <span class="input-group-btn">
                                    <button type="button" class="btn btn-default" data-bind="click: createWatchlist">Create</button>
                                </span>
                            </div>
                        </div>    
                    </form>
            <!-- /ko -->
        
            <!-- ko if: listOfWatchlists() != undefined && listOfWatchlists().length > 0 -->
            <ul class="nav nav-tabs" id="watchlistTabs">
                <li data-bind="attr : { class : (selectedWatchlist() != undefined) ? 'active' : '' }"><a href="#detailsTab" data-toggle="tab">Details</a></li>
                <li data-bind="attr : { class : (selectedWatchlist() != undefined) ? '' : 'active' }"><a href="#configTab" data-toggle="tab">Config</a></li>
            </ul>

            <div id="montageContents" class="tab-content">
                <div id="detailsTab" data-bind="attr : { class : (selectedWatchlist() != undefined) ? 'active tab-pane' : 'tab-pane' }">
                    <table class="table table-condensed" data-bind="with: selectedWatchlist">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Bid</th>
                                <th>Ask</th>
                                <th>L2</th>
                                <th></th>
                            </tr>
                        </thead>                
                        <tbody data-bind="foreach: map">
                            <tr data-bind="click: $parent.selectSymbolHandler">
                                <td data-bind="text: symbol, attr: {title: routeString}"></td>
                                <td data-bind="text: bidPrice, attr: {title: 'Bid size: '+bidSize()+' Exchange: '+bidExchange()}"></td>
                                <td data-bind="text: askPrice, attr: {title: 'Ask size: '+askSize()+' Exchange: '+askExchange()}"></td>
                                <td><button class="btn btn-default" type="button" data-bind="">L2</button></td>
                                <td><button class="btn btn-default" type="button" data-bind="click: $parent.removeInstrument">-</button></td>
                            </tr>

                            <!-- ko if: $parent.selectedSymbol() != undefined && $parent.orderDestinationsList().length == 0 && $parent.selectedSymbol() == $data -->
                            <tr>
                                <td colspan='3'>
                                    There are no available destinations.
                                </td>
                            </tr>
                            <!-- /ko -->

                            <!-- ko if: $parent.selectedSymbol() != undefined && $parent.orderDestinationsList().length > 0 && $parent.selectedSymbol() == $data -->
                            <tr id="selectedSymbolDetails">   
                                <td colspan='5'>
                                    <div id="L2Display">
                                        <div class="col-lg-6" id="L2Bids">
                                            <table>
                                                <tbody data-bind="foreach: $root.displayBuyL2">
                                                    <tr><td data-bind="text: price"></td><td data-bind="text: size"></td></tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div class="col-lg-6" id="L2Asks">
                                            <table>
                                                <tbody data-bind="foreach: $root.displaySellL2">
                                                    <tr><td data-bind="text: price"></td><td data-bind="text: size"></td></tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <form class="form container">
                                        <div class="input-group col-lg-12">
                                            <span class="input-group-addon">Order Type:</span>
                                            <select id="orderType" class="form-control" data-bind="options: $parent.orderTypesList(), value: $parent.orderFormOrderType"></select>
                                        </div>                                     

                                        <!-- ko if: $parent.orderFormOrderType() == "LIMIT" -->
                                        <div class="input-group col-lg-12">
                                            <span class="input-group-addon">Limit Price:</span>
                                            <input class="form-control" type="text" data-bind="value: $parent.orderFormLimitPrice">
                                        </div>                
                                        <!-- /ko -->

                                        <!-- ko if: $parent.orderFormOrderType() == "STOP" -->
                                        <div class="input-group col-lg-12">
                                            <span class="input-group-addon">Stop Price:</span>
                                            <input class="form-control" type="text" data-bind="value: $parent.orderFormStopPrice">
                                        </div>
                                        <!-- /ko -->

                                        <!-- ko if: $parent.orderFormOrderType() == "STOP_LIMIT" -->
                                        <div class="input-group col-lg-12">
                                            <span class="input-group-addon">Stop Price:</span>
                                            <input class="form-control" type="text" data-bind="value: $parent.orderFormStopPrice">
                                        </div>

                                        <div class="input-group col-lg-12">
                                            <span class="input-group-addon">Limit Price:</span>
                                            <input class="form-control" type="text" data-bind="value: $parent.orderFormLimitPrice">
                                        </div>
                                        <!-- /ko -->

                                        <div class="input-group col-lg-12">
                                            <span class="input-group-addon">Quantity:</span>
                                            <input class="form-control" type="text" data-bind="value: $parent.orderFormQuantity">
                                        </div>  
                                        <div class="input-group col-lg-12">
                                            <span class="input-group-addon">Expires:</span>
                                            <select id="expiration" class="form-control" data-bind="options: $parent.orderTifsList(), value: $parent.orderFormExpiration"></select>
                                        </div>
                                        <div class="input-group col-lg-12">
                                            <span class="input-group-addon">Destination:</span>
                                            <select id="destination" class="form-control" data-bind="options: $parent.orderDestinationsList(), value: $parent.orderFormDestination, optionsText: 'name'"></select>
                                        </div>                                               
                                        <div class="col-lg-12 centerVertical">
                                            <div class="col-lg-4">
                                                <button class="btn btn-default btn-sm" type="button" data-bind="click: $parent.cancelOrder">Cancel</button>
                                            </div>
                                            <div class="col-lg-8">
                                                <div class="btn-group btn-group-lg btn-block">
                                                    <button class="btn btn-default btn-danger" id="sellBtn" type="button" data-bind="click: $parent.placeOrderHandler">Sell</button>
                                                    <button class="btn btn-default btn-success" id="buyBtn" type="button" data-bind="click: $parent.placeOrderHandler">Buy</button>
                                                </div> 
                                            </div> 
                                        </div>


                                    </form>
                                </td>
                            </tr>
                            <!-- /ko -->
                        </tbody>
                    </table>
                </div>

                <div id="configTab" data-bind="attr : { class : (selectedWatchlist() != undefined) ? 'tab-pane' : 'active tab-pane' }">

                    <form role="form">
                        <!-- ko if: listOfWatchlists() != undefined && listOfWatchlists().length > 0 -->                    
                        <div class="form-group">
                            <label>Select Route:</label>
                            <select name="chooseRoute" class="form-control" data-bind="options: listOfRoutes, value: selectedRoute, optionsText: 'name'"></select>
                        </div>
                        <!-- /ko -->        

                        <!-- ko if: selectedRoute() != undefined && selectedWatchlist() != undefined -->                        
                        <div class="form-group">  
                            <label>Add Instrument:</label>                        
                            <div class="input-group">
                                <select name="chooseInstrument" class="form-control" data-bind="options: selectedRoute().route.instruments, value: selectedInstrument, optionsText: 'symbol'"></select>     
                                <span class="input-group-btn">
                                    <button class='btn btn-default' type='button' data-bind="click: selectedWatchlist().addInstrument">+</button>
                                </span>
                            </div>
                        </div>  
                        <!-- /ko -->

                        <div class="form-group">
                            <label for="exampleInputPassword1">New Watchlist:</label>
                            <div class="input-group">
                                <input type="text" class="form-control" id="newWatchlist" data-bind="value: newWatchlistName">
                                <span class="input-group-btn">
                                    <button type="button" class="btn btn-default" data-bind="click: createWatchlist">Create</button>
                                </span>
                            </div>
                        </div>    
                    </form>

                    <!-- ko if: listOfWatchlists() != undefined && listOfWatchlists().length > 0 -->
                    <button class="btn btn-default" type="button" data-bind="click: removeWatchlist">Delete</button>
                    <!-- /ko -->
                </div>
               
            </div>
            <!-- /ko -->

        </div>

    </div>
</script>

