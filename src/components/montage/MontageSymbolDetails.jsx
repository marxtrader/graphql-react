import React from 'react';

import Select from '../Select.jsx';
import DivOrderType from './DivOrderType.jsx';

//  DISABLED SYNTAX ERROR CHECKING

class MontageSymbolDetails extends React.Component {
  
    constructor(props) {
        super(props);
        this.orderTypes = [0, 1, 2, 3]; // to do: to make here GraphQL call
        this.orderTypeChange = this.orderTypeChange.bind(this);
        this.state = {
            currentOrderType: 'MARKET' // to do: first row on GraphQL call
        };
    };
    
    TypeList() {
        var tl = [];
        const types = this.orderTypes;
        for(var i = 0; i < types.length; i++){
            tl.push(ordTypes[i]); // from marx.orders.core.js
        }    
        return tl;
    };

    orderTypeChange(newType) {
        this.setState({currentOrderType: newType});
    }
    
    render(){
    return (
            <div>
                <form className="form" role='form'> 
                   <div className='form-group'>
                    <div className="input-group col-lg-12">
                        <span className="input-group-addon">Order Type:</span>
                        <Select items={this.TypeList()} onChange={this.orderTypeChange}/> 
                    </div>     
                    <DivOrderType currOrderType={this.state.currentOrderType} />

                    <div className="input-group col-lg-12">
                        <span className="input-group-addon">Quantity:</span>
                        <input type="text"/>
                    </div>  
                    <div className="input-group col-lg-12">
                        <span className="input-group-addon">Expires:</span>
                        <select id="expiration"></select>
                    </div>
                    <div className="input-group col-lg-12">
                        <span className="input-group-addon">Destination:</span>
                        <select id="destination"></select>
                    </div>   

                    <div className="col-lg-12 centerVertical"> 
                        <div className="btn-group btn-group-md">
                            <button className="btn btn-danger" id="sellBtn" type="button">Sell</button>
                            <button className="btn btn-success" id="buyBtn" type="button">Buy</button>
                        </div> 
                    </div> 

                  </div>
                </form> 
            </div>      
        );
    }
};

export default MontageSymbolDetails;
    
    
    
   {/*                <div id="L2Display">
                        <div className="col-lg-6" id="L2Bids">
                            <table>
                                <tbody>
                                    <tr>
                                        <td>test</td>
                                        <td>test</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="col-lg-6" id="L2Asks">
                            <table>
                                <tbody>
                                    <tr>
                                        <td>test</td>
                                        <td>test</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div> */}     