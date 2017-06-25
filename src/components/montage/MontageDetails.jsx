import React from 'react';

import MontageRow from './MontageRow.jsx';



const MontageDetails = (props) => {
    var WLmap = [];
    var listArr;
    if ((typeof props.watchList.list !== 'undefined') && (props.watchList.list !== null)){
        const list = props.watchList.list;
        const listInstr = list.split('^');
        for(var i = 0; i < listInstr.length; i++){            
            listArr = listInstr[i].split('|');            

            WLmap.push({
                instrumentID: listArr[0], 
                symbol: listArr[1], 
                routeString: listArr[2], 
                bidPrice: 0,
                askPrice: 0,
                bidExchange: -1,
                askExchange: -1,
                bidSize: 0,
                askSize: 0} );
        }
    }    
    
    const Lines =  WLmap.map( item => {
           return ( <MontageRow key={item.instrumentID} item={item} /> );
        });

    return (            
        <div className="container-fluid">
            <div className="row well well-sm">
                <div className="col-sm-3">Symbol</div>
                <div className="col-sm-2">Bid</div>
                <div className="col-sm-2">Ask</div>
                <div className="col-sm-2">L2</div>
                <div className="col-sm-1"></div>
            </div>
           {Lines}                   
        </div>          
    );
};

export default MontageDetails;
