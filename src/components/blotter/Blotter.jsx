import React from 'react';
const ApiSvc = require('../../../assets/js/services/tradingServer/apiSvc.js');


const Blotter = () => {
    
    function showMessage(isLogged){
        if (isLogged){
            alert("you are logged");
        }else{
            alert("you aren't logged");
        }
    }
    
    function testClick (){
        var isLogged = ApiSvc.isAlreadyLogged();
        showMessage(isLogged);
//            ApiSvc.getAccountPositions(3).then( res => {
//                positionList = res.body;
//                console.log('position list');
//                console.log(positionList);
//            });            
    };    
    function loginClick(){
        if (ApiSvc.isAlreadyLogged()) {
            console.log("already logged");
            showMessage(true);
            return;
        }
            
        var succ = ApiSvc.login('test', 'test');
        showMessage(succ); 
    };
    
    
  return (
    <div className="panel panel-default">
      <div className="panel-heading">BLOTTER</div>
      <div className="panel-body">
        Panel content
        <button className="btn" onClick={testClick}>test log state</button>
        <button className="btn" onClick={loginClick}>do log in as test</button>         
      </div>
    </div>
  );
};

export default Blotter;
