import React from 'react';

const LoginButton = (props) => {

        if (props.isLogged){
            return (
                  <button id="logout" type="button" onClick={props.doClick} 
                         value="false" className="btn btn-danger navbar-btn">
                    Log out
                  </button>     
                  );
        }else{
            return(
                  <button id="login" type="button" onClick={props.doClick} 
                          value="true" className="btn btn-success navbar-btn">
                    Log in
                  </button>  
                 );
        }
};

export default LoginButton;