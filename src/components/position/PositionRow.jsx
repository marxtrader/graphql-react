import React from 'react';
import PositionDetails from './PositionDetails.jsx';

const PositionRow = (props) => {

    return ( 
            <div className="panel-group" id="accordion" role="tablist" aria-multiselectable="true">
                <div className="well well-sm">
                    <div className="row">
                        <a role="button" data-toggle="collapse" data-parent="#accordion" href={'#' + props.item.symbol} aria-controls={props.item.symbol}>
                        <div className="col-sm-3">{props.item.symbol}</div>
                        <div className="col-sm-2">{props.item.price}</div>
                        <div className="col-sm-2">{props.item.quantity}</div>
                        <div className="col-sm-2">{props.item.currentPrice}</div>
                        <div className="col-sm-1">{props.item.exposure}</div>     
                        </a> 
                        <div className="col-sm-12 panel-collapse collapse" role="tabpanel" id={props.item.symbol}>
                            <PositionDetails />
                        </div>  
                    </div> 
                </div>   
            </div>    
          );
};

export default PositionRow;