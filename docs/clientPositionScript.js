//  export old script to file clientPosition.js for regular debug
<script type="text/javascript" src="/client/clientPosition.js"></script>
<script type="text/html" id="positionWidgetTemplate-tpl"></script>
<table class="table positionSummaryTable">
    <thead>
        <tr>
            <th>Symbol</th>
            <th>AvgPx</th>
            <th>Qty</th>
            <th>Quote</th>
            <th>Exposure</th>
        </tr>
    </thead>
    <tbody data-bind="foreach: positionList">
        <tr class="posSummaryRow" data-bind='click: showDetails'>
            <td data-bind="text: symbol" class="posSymbol"></td>
            <td data-bind="text: price" class="posPrice"></td>
            <td data-bind="text: quantity" class="posQuantity"></td>
            <td data-bind="text: currentPrice" class="posCurrentPrice"></td>
            <td data-bind="text: exposure" class="posExposure"></td>
        </tr>
         ko if: selectedPosition() != undefined && selectedPosition() == $data 
        <tr data-bind="with: selectedPosition">
            <td></td>
            <td colspan="4" class="positionPanelDetails">
                <table class="table positionTable">
                    <thead>
                        <tr>
                            <th>Market</th>
                            <th>AvgPx</th>
                            <th>Qty</th>
                        </tr>
                    </thead>
                    <tbody data-bind="foreach: allPositions">
                        <tr>
                            <td data-bind='text:exchangeName'></td>
                            <td data-bind='text:displayPrice' class="posPrice"></td>
                            <td data-bind='text:displayQuantity' class="posQuantity"></td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
         /ko 
    </tbody>

</table>
</script>