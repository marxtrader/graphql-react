'use strict';

const request = require('superagent');
const config = require('./config.js');

let cookie;

// CAN"T USE COOKIE DIRECTLY. IT"S BROWSER RESTRICTIONS
// 
// utility function for getting first cookie from response
//const getFirstCookie = ( res ) => {
//    const cookies = res.headers['set-cookie'];
//    console.log(cookies);
//    if (typeof cookies === 'undefined'){
//        console.log('cookie is undefined');
//        return null;
//    }
//    const cookie = cookies[0];
//    if ((!cookies) || (!cookie))
//        return null;
//    return cookie.substr(0, cookie.indexOf(';'));
//};

const isAlreadyLogged = () => {
    request.get(config.dataMgmtUrl)
            .withCredentials()
            .then( ( res ) => {
                if( res.header['content-type'].indexOf('text/html') === -1 ) {
                    return true;
                }else{
                    return false;
                }
            })
            .catch( (err) => {
                console.log('error login' + err);
            });
};


/**
 * utility function to do login
 * 1) send request for base url
 * 2) parse response cookies and get first ( JSESSIONID )
 * 3) send request with one cookie and creds
 * 4) return 2 cookies (first response cookie ( JSESSIONSSO ) and one cookie above ( JSESSIONID ))
 * 5...) getting REST data with JSESSIONSSO cookie ( on the session) - magic
 * @param {String} username
 * @param {String} password 
 * @returns {}
 */
const login = (username, password) => {
//    return new Promise((resolve, reject) => {
        request.get(config.dataMgmtUrl)
            .redirects(0) //  max count allowing redirects
            .withCredentials()
            .then((res) => {
                if( res.header['content-type'].indexOf('text/html') >= 0 ) {
                    console.log('got the login form...');

                    request.post(config.loginUrl)
                        .timeout(5000)
                        .redirects(1)
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        .withCredentials()
                        .send({j_username: username, j_password: password})
                        .then(res => {                            
                            return res;
                        })
                        .catch ( err => {
                            console.log("error login: " + err);
                            return null;
                        });
                    }else
                        return null;
                    })
            .catch( (err) => {
                console.log('config.dataMgmtUrl: ' + config.dataMgmtUrl);
                console.log('error log in: ' + err);
                return null;
            });
//    });
};

const logout = () => {
  return request.get(config.serverUrl + 'LogOut')
          .withCredentials();
};

const getCurrentUserInfo = () => {
    return request.get(config.dataMgmtUrl + 'rest/users/current')
            .timeoCut(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

// e.g. http://testing.marx.tech:8080/etsdatamanagement/rest/watchlist/ids
const getWatchListIds = () => {
    return request.get(config.dataMgmtUrl + 'rest/watchlist/ids')
            .timeout(5000)
            .redirects(0) // ? why it here?
//            .set('Cookie', cookie)
//            .set('Accept', 'application/json') // be default
            .withCredentials()
            .then( ( res ) => {
                console.log(res.body);
                return res.body;
            })
            .catch( ( err ) => {
                console.log('error getting watchlists: ' + err);
            });
};

const getAccounts = () => {
    return request.get(config.dataMgmtUrl + 'rest/accounts')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

const getOrderStates = () => {
    return request.get(config.dataMgmtUrl + 'rest/watchlist');

};

const getWatchlistId = () => {
    // get the watchlist id to retrieve , append to the call
    // return request.get(config.dataMgmtUrl+'rest/watchlist/ids')
};

const getCompanyDepartmentId = () => {
    return request.get(config.dataMgmtUrl + 'rest/users/current/companies/divisions')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

const getCompanyIdInfo = () => {
    return request.get(config.dataMgmtUrl + 'rest/users/current/companies/all')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

const getActiveCompanies = () => {
    return request.get(config.dataMgmtUrl + 'rest/users/current/companies/live')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

const getAllUsers = () => {
    return request.get(config.dataMgmtUrl + 'rest/users/all')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

const getAllUserRoles = () => {
    return request.get(config.dataMgmtUrl + 'rest/role/all')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

const getAvailableExchanges = () => {
    return request.get(config.dataMgmtUrl + 'rest/exchanges/all')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

const getPermittedRoutes = () => {
    return request.get(config.dataMgmtUrl + 'rest/routes/permitted/all')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

const getSystemEvents = () => {
    return request.get(config.dataMgmtUrl + 'rest/systemevents/all')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

const getAllDestinations = () => {
    return request.get(config.dataMgmtUrl + 'rest/destinations/all')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

const getUserIds = () => {
    return request.get(config.dataMgmtUrl + 'rest/userids')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

const getActiveOrders = () => {
    return request.get(config.dataMgmtUrl + 'rest/orders/active')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

const getOrderEvents = () => {
    return request.get(config.dataMgmtUrl + 'rest/orders/events')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

const getOrderTimeInForce = () => {
    return request.get(config.dataMgmtUrl + 'rest/orders/tifs')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

const getOrderSides = () => {
    return request.get(config.dataMgmtUrl + 'meta/orders/sides')
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

//const getAccountTypes = () => {};
const getInstrumentTypes = () => {
    return request.get(config.dataMgmt + 'meta/instrument/types')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

const getTicketStates = () => {
    return request.get(config.dataMgmt + 'meta/orders/states')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};

/**
 * http://oms-node.marx.tech:8080/omsrestservices/rest/accounts/<id account>/positions
 * @param {int} accountID
 * @return {array} positionList
 */
const getAccountPositions = (accountID) => {
    return request.get(config.orderMgmtRestUrl + 'accounts/' + accountID + '/positions')
            .timeout(5000)
            .redirects(0)
//            .set('Cookie', cookie)
//            .set('Accept', 'application/json') by default
            .then( ( res )=> {
                return res.body;
            });
};

module.exports.isAlreadyLogged = isAlreadyLogged;
module.exports.login = login;
module.exports.logout = logout;
module.exports.getCurrentUserInfo = getCurrentUserInfo;
module.exports.getWatchListIds = getWatchListIds;
module.exports.getActiveOrders = getActiveOrders;
module.exports.getTicketStates = getTicketStates;
module.exports.getOrderSides = getOrderSides;
module.exports.getInstrumentTypes = getInstrumentTypes;
module.exports.getOrderTimeInForce = getOrderTimeInForce;
module.exports.getOrderEvents = getOrderEvents;
module.exports.getUserIds = getUserIds;
module.exports.getAllDestinations = getAllDestinations;
module.exports.getSystemEvents = getSystemEvents;
module.exports.getPermittedRoutes = getPermittedRoutes;
module.exports.getAvailableExchanges = getAvailableExchanges;
module.exports.getAllUserRoles = getAllUserRoles;
module.exports.getAllUsers = getAllUsers;
module.exports.getActiveCompanies = getActiveCompanies;
module.exports.getCompanyIdInfo = getCompanyIdInfo;
module.exports.getCompanyDepartmentId = getCompanyDepartmentId;
module.exports.getAccountPositions = getAccountPositions;
