import React from 'react';


const WatchListEdit = (props) => {
     
//  expand tabs
  $('#watchlistEditTabs a').click(function (e) {
        e.preventDefault();
        var tab = $(this);

        if(tab.parent('li').hasClass('active')){   
            window.setTimeout(function(){
                tab.parent('li').removeClass('active');
                $('.itemWLTab').removeClass('active');
            }, 1);
        }else{
            window.setTimeout(function(){
                tab.tab('show'); 
            }, 1);
        }
  });     
     
     
return (
        <div>    
            <ul id='watchlistEditTabs' className="nav nav-tabs">
                <li className='nav-item'> 
                    <a href='#addTab' data-toggle="tab"> Add </a> 
                </li>
                <li className='nav-item'> 
                    <a href='#deleteTab' data-toggle="tab"> Delete </a> 
                </li>        
            </ul>  

            <div className="tab-content">
                <div id='addTab' className='tab-pane itemWLTab'>
                    <form role='form'>
                        <div className='form-group'>
                            <label>New Watchlist:</label>
                            <div className='input-group'>
                                <input id='newWatchlist' type='text' className='form-control'/>
                                <span className="input-group-btn">
                                    <button className="btn btn-success" type="button">Create</button>
                                </span>
                            </div>
                        </div>  
                    </form>
                </div>  
                <div id='deleteTab' className='tab-pane itemWLTab'>
                    <div id='deleteTab' data-toggle='tab'>
                        <button className="btn btn-warning" type="button">Delete current</button>
                    </div>
                </div>
            </div>   
        </div>
     );
};
export default WatchListEdit;