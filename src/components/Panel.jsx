import React from 'react';

const Panel = (props) => {

    return (
            <div className="panel panel-default">
                <div className="panel-heading">{props.caption}</div>
                <div className="panel-body">   
                {props.content}
                </div>
            </div>
          );
};

export default Panel;