import React from 'react';
import { gql, graphql } from 'react-apollo';

function TodoApp( { data: { loading, error, WatchLists, refetch } } ) {

//    console.log('enter to todoApp...');
//    console.log(typeof WatchLists);
//    console.log(JSON.stringify(WatchLists));

    if (loading) {   // networkStatus < 7
        return <p>Loading...</p>;
    } else if (error) {
        return <p>{error.message}</p>;
    }
    
    return (
            <div>
                <button onClick={() => refetch()}>
                    Refresh
                </button>
                <ul>
                    {WatchLists.map((wl) => (<li key={wl.id}> {wl.name} </li>))};
                </ul>
            </div>
            );
}

// export default graphql(gql`  
//  query TodoAppQuery {
//    WatchLists {
//      id
//      name
//    }
//  }
//`)(TodoApp);
export default graphql(gql`{  
      WatchLists {
            id
            name
        }
}`)(TodoApp);
