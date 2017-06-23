import { combineReducers } from 'redux'
import { createStore } from 'redux'

import {SET_AUTHENTICATED_STATE} from './actions' // action types
import {setAuthState} from './actions' // actions



const initialState = {
  isAuthenticated: false
};

function UserStateReduser(state = initialState, action){
    switch (action.type) {
        case SET_AUTHENTICATED_STATE: {
                return Object.assign({}, state, {
                    isAuthenticated: action.state
                });   
            }
        default:
            return state;
    }
    
    
}

const globalState = combineReducers({
    UserStateReduser  // only one for now
});

export default globalState
