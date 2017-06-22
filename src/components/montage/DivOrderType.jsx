import React from 'react';

const DivOrderType = (props) => {
    switch (props.currOrderType) {
    case 'LIMIT':   {/*  <!--ko if: $parent.orderFormOrderType() == "LIMIT"-->  */}
        return (<div className="input-group col-lg-12">
                    <span className="input-group-addon">Limit Price:</span>
                    <input type="text"/>
               </div> );
        break
    case 'STOP':   {/* <!-- ko if: $parent.orderFormOrderType() == "STOP" --> */}
        return (<div className="input-group col-lg-12">
                    <span className="input-group-addon">Stop Price:</span>
                    <input type="text"/>
               </div>);
        break
    case 'STOP_LIMIT':    {/* <!-- ko if: $parent.orderFormOrderType() == "STOP_LIMIT" --> */}
        return (<div>
                <div className="input-group col-lg-12">
                    <span className="input-group-addon">Stop Price:</span>
                    <input type="text"/>
               </div>
               <div className="input-group col-lg-12">
                    <span className="input-group-addon">Limit Price:</span>
                    <input type="text"/>
               </div>
               </div>);
        break
    default:
        return null;
    }
};

export default DivOrderType;