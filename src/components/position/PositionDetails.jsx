import React from 'react';

class PositionDetails extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() { }

render() {
        return (
                <div className="panel panel-warning">
        
                    <div className="panel-heading">
                        <div className="row">
                            <div className="col-md-9  col-md-offset-3">
                                <div className="row">
                                    <div className="col-sm-4">Market</div>
                                    <div className="col-sm-4">AvgPx</div>
                                    <div className="col-sm-4">Qty</div>
                                </div>
                            </div>
                        </div>
                    </div>  
                    <div className="panel-body">
                        <div className="row">
                            <div className="col-md-9 col-md-offset-3">
                                <div className="row">
                                    <div className="col-sm-4">{this.props.exchangeName}</div>
                                    <div className="col-sm-4">{this.props.displayPrice}</div>
                                    <div className="col-sm-4">{this.props.displayQuantity}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                </div>
            );
        }
};

PositionDetails.defaultProps = {
        exchangeName: "test name",
        displayPrice: 111111.11,
        displayQuantity: 10000000
};


export default PositionDetails;