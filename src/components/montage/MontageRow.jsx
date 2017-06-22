import React from 'react';

import MontageSymbolDetails from './MontageSymbolDetails.jsx';

const MontageRow = (props) => {
/*
    const rowStyle={
        paddingTop: '10px',
        paddingBottom: '5px',
        borderTop: '1px solid #ccc'
    };
    const lineStyle={
        padding: '10px'
    };   */ 

    return (
        <div className="panel-group" id="accordion" role="tablist" aria-multiselectable="true">
            <div className="well well-sm">
                    <div className="row">
                        <a role="button" data-toggle="collapse" data-parent="#accordion" href={'#' + props.item.instrumentID} aria-controls={props.item.instrumentID}>
                        <div className="col-sm-3" title={'Bid size: '+props.item.bidSize+' Exchange: '+props.item.bidExchange}> {props.item.symbol} </div>
                        <div className="col-sm-2">0</div>
                        <div className="col-sm-2">0</div>
                        </a>                
                        <div className="col-sm-2"><button className="btn btn-default btn-sm">L2</button></div>
                        <div className="col-sm-1"><button className="btn btn-default btn-sm">-</button></div>     
                        <div className="col-sm-12 panel-collapse collapse" role="tabpanel" id={props.item.instrumentID}>
                            <MontageSymbolDetails/>
                        </div>  
                    </div> 
            </div>   
        </div>    
       );
};

export default MontageRow;
