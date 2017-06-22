import React from 'react';

class ChangeMe extends React.Component{
    
    constructor(props) {
        super(props);
        this.state = {

        };
    }     
    
    componentDidMount() {    
        // here actions after mounted component
    }
    
    componentWillUpdate(){
        // here actions before update state
    }
    
    componentDidUpdate(){
        // here actions afted update state
    }
   
    render() {
        return ( 
                <p>Please change text here</p>       
              );
        }
};

ChangeMe.defaultProps = {

};


export default ChangeMe;