import React from 'react';
import { gql, graphql } from 'react-apollo';

class WatchListData extends React.Component{
    
    constructor(props){
        super(props);
        this.onGetData = this.onGetData.Bind(this);
        this.state={
            watchlists: []
        };
    }

    componentWillReceiveProps(nextProps){
      // NOTES: be careful because nextProps not always diff from props !
        if (typeof nextProps.data.WatchLists !== 'undefined'){
            const wl = nextProps.data.WatchLists;
            this.setState({  
                watchlists: wl
            });
        }
    }
  
    componentDidUpdate(){
        this.props.onGetData(this.state.watchlists);
    }

    render(){
    return (  
            <div>
            
            </div>
          );
    }
};

const RootQ = gql`{  
      WatchLists {
            id
            name
            list
        }
    }`
;

export default graphql(RootQ)(WatchListData);