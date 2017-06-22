

function Instrument(symbol, baseSymbol, exchangeid, underlyingid, id, type, attributes) {
    var self = this;
    self.symbol = symbol;
    self.baseSymbol = baseSymbol;
    self.exchangeID = exchangeid;
    self.underlyingID = underlyingid;
    self.ID = id;
    self.type = type;
    self.attributes = attributes;
}

function Position(accountid, price, quantity, instrument, exchangeName, options) {
    var self = this;
    self.accountID = accountid;
    self.price = price;
    self.quantity = quantity;
    self.instrument = instrument;
    self.options = options;

    self.displaySymbol = self.instrument.symbol;
    self.displaySide = self.quantity() > 0 ? "LONG" : "SHORT";
    self.displayQuantity = addCommas(options.qtyAsLots ? self.quantity() / options.lotSize : self.quantity(), 5);
    self.displayPrice = self.price().toFixed(5);
    self.exchangeName = exchangeName;
}

function PositionSummary(price, quantity, symbol) {
    var self = this;
    self.price = price;
    self.quantity = quantity;
    self.symbol = symbol;
    self.currentPrice = 0;
    self.allPositions = [];
    self.selectedPosition = 0;

    self.showDetails = function (position) {
        if (self.selectedPosition() !== null) {
            self.selectedPosition(null);
            return;
        }
        self.selectedPosition(position);
    };

    // exposure = sum (price * quantity)
    self.exposure = function () {
        var exposure = 0;
        for (var i = 0; i < self.allPositions().length; i++) {
            var thisPos = self.allPositions()[i];
            exposure += thisPos.price() * thisPos.quantity();
        }
        return exposure.toFixed(2);
    };
}


module.exports = {
    PositionSummary: PositionSummary,
    Instrument: Instrument,
    Position: Position
};