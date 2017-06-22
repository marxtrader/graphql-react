import React from 'react';

class Select extends React.Component{
    
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.state = {
            items: props.items
        };
    }     
    
    handleChange(e){
        this.props.onChange(e.target.value);
    }

    componentDidMount() { 
        const items = this.state.items;
        
        // note: map without brackets and "return" 
        const opts = items.map( (item) => 
            <option key={item}>{item}</option>
        );
           
        this.setState({
            options: opts
        });
    }
   
    render() {
        return ( <select onChange={this.handleChange}>
                    {this.state.options}
                </select>           
              );
        }
};

Select.defaultProps = {
     items: ["empty"]
};


export default Select;