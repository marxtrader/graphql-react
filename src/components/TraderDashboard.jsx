import React from 'react';
import Header from './header/Header.jsx';
import Watchlist from './watchlist/Watchlist.jsx';
import WatchlistData from './watchlist/WatchListData.jsx';
import OrderPanel from './OrderPanel.jsx';
import Montage from './montage/Montage.jsx';
import Blotter from './blotter/Blotter.jsx';
import CurrentPositions from './position/CurrentPositions.jsx';
import TimeAndSales from './TimeAndSales.jsx';
import Signin from './Signin.jsx';
import apiSvc from '../../assets/js/services/tradingServer/apiSvc';
import { gql, graphql } from 'react-apollo';

class TraderDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.onSignAction = this.onSignAction.bind(this);
    this.onChangeCurWatchList = this.onChangeCurWatchList.bind(this);
    this.onGetData = this.onGetData.bind(this);
    this.state = {
      watchlists: [],
      currentWatchListID: 0,
      isLoggedIn: false,
      htmlLogin: null
    };
  }

  sellButtonClicked() {
   // apiSvc.doSellOrder();
  }
  
  componentDidMount() {
      var testLogged = apiSvc.isAlreadyLogged(); 
      this.setState( { isLoggedIn: testLogged} );
  }
  
  componentWillReceiveProps(nextProps){
      // NOTES: be careful because nextProps not always diff from props !
      if (typeof nextProps.data.WatchLists !== 'undefined'){
            const wl = nextProps.data.WatchLists;
            this.setState({  
                watchlists: wl,
                currentWatchListID: wl[0].id
            });
      }
  }

  onChangeCurWatchList (id) {
    this.setState({ currentWatchListID: id });
  }  

  onSignAction(newState){
        window.console.log("need implement this call...");
  }
  
  onGetData(data){
        const wl = data;
        this.setState({  
            watchlists: wl,
            currentWatchListID: wl[0].id
        });    
  }

  render() {    
        return (
          <div className="container-fluid">
            <Header onSignAct={this.onSignAction} isLogged={this.state.isLoggedIn}/>
            <div className="well">
              <strong>MARX TRADING SYSTEM CLIENT</strong>
            </div>
            <div className="row">
              <div className="col-md-4">
                <Watchlist watchLists={this.state.watchlists} onChange={this.onChangeCurWatchList}/>
                <Montage watchListID={this.state.currentWatchListID}/>                      
              </div>
              <div className="col-md-8">
                <div className="row">
                  <div className="col-md-12">
                  <Blotter />
                </div>
                </div>
                <div className="row">
                  <div className="col-md-7">
                    <CurrentPositions isLogged={this.state.isLoggedIn}/>
                  </div>
                  <div className="col-md-5">
                    <TimeAndSales />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
}

const RootQ = gql`{  
      WatchLists {
            id
            name
            list
        }
    }`
;


export default graphql(RootQ)(TraderDashboard);
