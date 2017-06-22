import React from 'react';
import { Redirect } from 'react-router-dom';
const ApiSvc = require('../../assets/js/services/tradingServer/apiSvc.js');

class Signin extends React.Component{
    constructor(props){
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleCredChange = this.handleCredChange.bind(this);
        this.state={
            username: '',
            password: '',
            redirectToReferrer: false
        };
    }
    
    handleSubmit(){
        var succ;
        if ((this.state.username === '' ) || (this.state.password === ''))
            succ = false;
        else{
            succ = true;
            this.setState({ redirectToReferrer: true });
        }
    /*    var succ = false;
        succ = ApiSvc.login(this.state.username, this.state.password);
//                .then( ( res ) => {
//                    if ((res.ok) ){
//                        succ = true;
//                    }
//                })
//                .catch( (err) => {
//                    succ = false;
//                    console.log('error log in process: ' + err);
//                });
       */         
//        console.log(JSON.stringify(this.props));
        //this.props.location.state.onSign(succ); // level up (using react-router location.state object as a container custom parameters)
    }
    
    componentDidUpdate(){ }
    
    handleCredChange(event){
        const value = event.target.value;
        const name = event.target.name;
        this.setState({ [name]: value});
    }
    
    render(){
//        console.log(JSON.stringify(this.props));
        const {from} = this.props.location.state || {from: {pathname: '/reactfront'}};
        
        if (this.state.redirectToReferrer) {
            from.state = {isAuth: true};
            return ( <Redirect to={from}/> );
        }else
            return ( 
                <div className="container">
                <form className="form-signin" onSubmit={this.handleSubmit}>
                    <h2 className="form-signin-heading">Please sign in</h2>
                    <input name="username" value={this.state.username} onChange={this.handleCredChange} className="form-control" placeholder="Username" required="" autoFocus=""/>
                    <input name="password" value={this.state.password} onChange={this.handleCredChange} className="form-control" placeholder="Password" required="" type="password"/>
                    <div className="checkbox">
                    <label><input value='remember-me' type='checkbox'/>Remember me</label>
                    </div>
                    <button className='btn btn-lg btn-primary btn-block' type='button' onClick={this.handleSubmit}>Log in</button>
                </form>
                </div>
            );        
    }
};

export default Signin;