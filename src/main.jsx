import React from 'react';
import ReactDom from 'react-dom';
import TraderDashboard from './components/TraderDashboard.jsx';
import { ApolloProvider } from 'react-apollo';
import client from './graphql/GraphqlEndpoint.jsx';
import { BrowserRouter as Router, Route, Link, Redirect, withRouter } from 'react-router-dom';
import Signin from './components/Signin.jsx';
const config = require('../assets/js/services/tradingServer/config.js');

//import { createStore } from 'redux'
//import globalState from '../assets/js/redux/reducers.js';
//import {setAuthState} from '../assets/js/redux/actions.js'; // actions

//let store = createStore(globalState); // redux store

// Log the initial state
//console.log(store.getState());

// Every time the state changes, log it
// Note that subscribe() returns a function for unregistering the listener
//let unsubscribe = store.subscribe(() => {
//    console.log(store.getState());
//    fakeAuth.isAuthenticated = store.getState().isAuthenticated;
//    }            
//);

const Entry= ({...props}) => {
      return ( <ApolloProvider client={client}>
                    <TraderDashboard {...props}/>
                </ApolloProvider> );
    };
    
const fakeAuth = {
  isAuthenticated: false,
  signin(history) {
    isAuthenticated = true;  
    //store.dispatch(setAuthState(true));
    setTimeout(history.push(config.dashboardPath), 100); 
  },
  signout(history1) {
     isAuthenticated = false;   
//    store.dispatch(setAuthState(false));
    setTimeout(history1.push(config.loginPath), 100);
  }
};    

//const AuthButton = withRouter(({ history }) => (
//        fakeAuth.isAuthenticated ? (
//                <p>  <button onClick={() => fakeAuth.signOut(history)} >Sign out</button> </p>
//              ) : (
//                <p>  <button onClick={ () => fakeAuth.signIn(history)} >Sign in</button> </p>
//              )
//));

const PrivateRoute = ({component:Component, ...rest}) => {
    const route = ( props ) => {
                    if ((typeof props.location.state !== 'undefined') && 
                        (typeof props.location.state.isAuth !== 'undefined')){
                            fakeAuth.isAuthenticated = props.location.state.isAuth; // may returned from Signin.jsx 
                    }
                    return (
                    (fakeAuth.isAuthenticated) ? (
                       (<Component {...props}/>)
                    ) : (
                       <Redirect to={ {
                            pathname: config.loginPath,
                            state: { from: props.location,
                                     isAuth: fakeAuth.isAuthenticated
                                    }
                      } } />
                    ));
        };
    
    return ( <Route {...rest} render={ (props) => route(props) } /> );
};

//const PrivateComponentTest = () => {
//    return ( <p> here security text! </p>);
//};

//const onSignAction = (newState) => {
//      fakeAuth.isAuthenticated = newState;
//};    

ReactDom.render( (
        <Router basename="/graphql-react">
            <div>
                <Route path={config.loginPath} component={Signin} />   
                <PrivateRoute path={config.dashboardPath} component={Entry} />
            </div>
        </Router>
        ), document.getElementById('app')
 );


 // <PrivateRoute path={dashboardPath} component={Entry} />

// 
//       <!--<AuthButton />-->
// <Route exact path={dashboardPath} component={Entry} />       
//  <Link to={privatePath}>Private </Link>
//<Route exact path={dashboardPath} component={Entry} />  
// ({location, onSignAction}) => LoginForm({location, onSignAction}) 
