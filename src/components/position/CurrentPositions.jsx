import React from 'react';

import PositionRow from './PositionRow.jsx';
const ApiSvc = require('../../../assets/js/services/tradingServer/apiSvc.js');
var Position = require('../../../assets/js/position.js');

//  DISABLED SYNTAX ERROR CHECKING

class CurrentPositions extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sessionCookies: '',
            account: 3, // user - test
            positionList: [{
                    symbol: "USD",
                    price:1,
                    quantity:2,
                    currentPrice:3,
                    exposure:4
                }],
            isLogged: this.props.isLoggedIn
        };
    }
    
    componentDidMount() { }
    
    componentDidUpdate(){ 
        if (this.state.isLogged){
            ApiSvc.getAccountPositions(this.state.account).then( res => {
                var positList = res;
                if (positList === null) 
                    return;
                if ( !Array.isArray(positList)){
                    console.log('getAccountPositions: not JSON response. Possible need log in again...');
                    return;
                }
                positList = Position.updatePositionList(positList);
                this.setState( {positionList: positList} );
            });
        }    
    }

    render() {
        const Lines = this.state.positionList.map( item => {
           return ( <PositionRow key={item.symbol} item={item} /> );
        });
        
        const styleCaption={ textAlign: 'center' };   
        
        return (
                <div className="panel panel-warning">
                    <div className="panel-heading">
                        <div className="container-fluid">
                                <p style={styleCaption}>CURRENT POSITIONS</p>
                            <div className="row">
                                    <div className="col-sm-3">Symbol</div>
                                    <div className="col-sm-2">AvgPx</div>
                                    <div className="col-sm-2">Qty</div>
                                    <div className="col-sm-2">Quote</div>
                                    <div className="col-sm-3">Exposure</div>
                            </div>
                        </div>
                    </div>
                    <div className="panel-body">
                        {Lines}
                    </div>
                </div>
             );
    }
};

export default CurrentPositions;
