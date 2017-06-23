// action types and actions for Redux

const SET_AUTHENTICATED_STATE = 'SET_AUTHENTICATED_STATE';

function setAuthState(state) {
  return {
    type: SET_AUTHENTICATED_STATE,
    state
  };
}


export {
    SET_AUTHENTICATED_STATE,
    setAuthState
};
