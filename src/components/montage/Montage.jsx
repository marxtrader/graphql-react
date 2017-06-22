import React from 'react';
import { gql, graphql } from 'react-apollo';
import MontageDetails from './MontageDetails.jsx';
import MontageConfig from './MontageConfig.jsx';

const MontagePanel = (props) => {

  var wl = {};
  if (typeof props.data.WatchLists !== 'undefined'){  
      wl = props.data.WatchLists[0]; // always single
  }    
  
  $('#watchlistTabs a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });
  
  return (
    <div className="panel panel-default">
      <div className="panel-heading">MONTAGE PANEL</div>
      <div className="panel-body">  
        <ul id='watchlistTabs' className="nav nav-tabs">
            <li className='active'> 
                <a href='#detailsTab' data-toggle="tab"> Details </a> 
            </li>
            <li className=''> 
                <a href='#configTab' data-toggle="tab"> Config </a> 
            </li>        
        </ul>
        
        <div className="tab-content">
            <div id='detailsTab' className='tab-pane active'>
                <MontageDetails watchList={wl} />
            </div> 
            <div id='configTab' className='tab-pane'>
                <MontageConfig watchList={wl}/>  
             </div>
        </div>
      </div>
    </div>
  );
};

const GetListQ = gql`
    query qr ( $watchListID: Int) {
      WatchLists (watchListID: $watchListID) {
            id
            list
        }
  }`
;

const Montage = graphql(GetListQ, {
  options: ({ watchListID }) => ({ variables: { watchListID} })
})(MontagePanel);

export default Montage;