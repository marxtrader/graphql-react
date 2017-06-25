import React from 'react';
import WatchListEdit from './WatchListEdit';

const WatchList = (props) => { 

  if (typeof props.watchLists === 'undefined'){
      return (<p> data is empty </p>);
  }  
  
  
  
  // need change this.currentWatchListID.
    const options = props.watchLists.map( item => {
        return (<option key={item.id} onClick={() => onChangeWatchList( item.id ) } > {item.name}</option>);
    });   
  
  
  function onChangeWatchList (id){
      props.onChange(id);
  };

  return (
    <div className="panel panel-default">
      <div className="panel-heading">WATCHLIST</div>
      <div className="panel-body">
        <select className='form-control'>
          {options}
        </select>
        <WatchListEdit />

      </div>
    </div>
  );
};


export default WatchList;
