import React from 'react';

const ApiSvc = require('../../../assets/js/services/tradingServer/apiSvc.js');
import LoginButton from './LoginButton.jsx'; 

class Header extends React.Component {
    
    constructor(props){
        super(props);
        this.handleSignAct= this.handleSignAct.bind(this);
        this.doRemoteLogin = this.doRemoteLogin.bind(this);
        this.state={
            loginHTML: null
        };
    };

    doRemoteLogin(){
        ApiSvc.login('test', 'test')
                .then( ( res ) => {
                    if ((res.ok) && (res !== null)){
                    }            
                });
    }   

    handleSignAct(e){
        if (this.props.isLogged){
            ApiSvc.logout();
        }else{
            var htmlLogin = this.doRemoteLogin(); 
            if (htmlLogin !== null) 
                this.props.onSignAct(htmlLogin); // move level up
        }
    }   

    render(){  
      return (
        <nav className="navbar navbar-primary navbar-inverse">
          <div className="container-fluid">
            <div className="navbar-header">
              <button type="button" className="navbar-toggle collapsed"
                data-toggle="collapse" data-target="#navbar-collapse"
                aria-expanded="false">
                <span className="sr-only">Toggle navigation</span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
              </button>
              <a className="navbar-brand" href="#">MARX TECH</a>
            </div>

            <div className="collapse navbar-collapse" id="navbar-collapse">
              <ul className="nav navbar-nav navbar-right">
                <li className="active"><a href="#">TRADING</a></li>
                <li><a href="#">ACCOUNTS</a></li>
                <li><LoginButton isLogged={this.props.isLogged} doClick={this.handleSignAct} /></li>
              </ul>
            </div>
          </div>
        </nav>
      );
    }
};

Header.defaultProps = {
//    isLogged: false
};

export default Header;
