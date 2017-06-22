'use strict';

const request = require('superagent');
const expect = require('chai').expect;
const assert = require('chai').assert;
const config = require('../assets/js/services/tradingServer/config.js');
const describe = require('mocha').describe;

describe('start test file ApiTests.ja', () => {
    
    console.log('config.dataMgmtUrl: ' + config.dataMgmtUrl);
    console.log('config.loginUrl: ' + config.loginUrl);
    console.log('config.dataMgmtUrl: ' + config.dataMgmtRestUrl);
    console.log('config.orderMgmtRestUrl: ' + config.orderMgmtRestUrl);
    console.log('config.marketDataRestUrl: ' + config.marketDataRestUrl);

// utility function for getting first cookie from response
const getFirstCookie = (res) => {
    const cookies = res.headers['set-cookie'];
    const cookie = cookies[0];
    if (!cookies)
        return null;
    return cookie.substr(0, cookie.indexOf(';'));
};

/**
 * utility function to do login
 * 1) send request for base url
 * 2) parse response cookies and get first 
 * 3) send request with one cookie and creds
 * 4) return 2 cookies (first response cookie and one cookie above )
 * @returns {Promise}
 */
const doLogin = () => {
    return new Promise((resolve, reject) => {
        request.get(config.dataMgmtUrl)
                .timeout(20000)
                .then(getFirstCookie)
                .then(sessionCookie => {
                    request.post(config.loginUrl)
                            .timeout(20000)
                            .redirects(1)
                            .set('Content-Type', 'application/x-www-form-urlencoded')
                            .set('Cookie', sessionCookie)
                            .send({j_username: config.username, j_password: config.password})
                            .then(res => {
                                const sessionCookies = sessionCookie + '; ' + getFirstCookie(res);
                                resolve(sessionCookies);
                            });
                    })
                .catch(err => {
                    console.log('--- error in doLogin');
                    console.log(err);
                    reject(err);
                    });
    });
};

describe('get /etsdatamanagement/ without sending session cookie', () => {
    it('responds with 200, JSESSIONID cookie, and login form html', () => {
        return request.get(config.dataMgmtUrl)
                .timeout(20000)
                .redirects(0)
                .then( (res) => {
                    expect(res.status).to.equal(200);
                    const cookie = getFirstCookie(res);
                    expect(cookie).to.contain('JSESSIONID');
                    expect(res.text).to.contain('<h1>Log On</h1>');
                    expect(res.text).to.contain("<form method='POST' action='j_security_check'>");
                });
    });
});


describe('get /etsdatamanagement/ with invalid session cookie sent', () => {
    it('responds with 200, JSESSIONID cookie, and login form html', () => {
        return request.get(config.dataMgmtUrl)
                .timeout(20000)
                .redirects(0)
                .set('Cookie', 'oV5PUvDbVf6skF2ARgbODqYA')
                .then(res => {
                    console.log('starting...');
                    expect(res.status).to.equal(200);
                    const cookie = getFirstCookie(res);
                    expect(cookie).to.contain('JSESSIONID');
                    expect(res.text).to.contain('<h1>Log On</h1>');
                    expect(res.text).to.contain("<form method='POST' action='j_security_check'>");
                });
    });
});


describe('login with good username and password', () => {
    // get session cookie first
    beforeEach(done => {
        request.get(config.dataMgmtUrl)
                .timeout(20000)
                .then(res => {
                    this.sessionCookie = getFirstCookie(res);
                    done();
                });
    });

    it('does a redirect', () => {
        request.post(config.loginUrl)
                .timeout(20000)
                .redirects(0)
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .set('Cookie', this.sessionCookie)
                .send({j_username: config.username, j_password: config.password})
                .then(res => {
                    expect(res.status).to.equal(200);
                    console.log(res.body);
                    })
                .catch( err => {
                    console.log(err);
                });
    });

    it('responds with 200 and JSESSIONIDSSO cookie', (done) => {
        request.post(config.loginUrl)
                .timeout(20000)
                .redirects(1)
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .set('Cookie', this.sessionCookie)
                .send({j_username: config.username, j_password: config.password})
                .then(res => {
                    expect(res.status).to.equal(200);
                    const cookie = getFirstCookie(res);
                    expect(cookie).to.contain('JSESSIONIDSSO');
                    done();
                });
    });
});

describe('login with good username and bad password', () => {
    // get session cookie first
    beforeEach(done => {
        request.get(config.dataMgmtUrl)
                .timeout(20000)
                .then(res => {
                    this.sessionCookie = getFirstCookie(res);
                    done();
                });
    });
    it('responds with 200, no cookies, and logon failure html', (done) => {
        request.post(config.loginUrl)
                .timeout(20000)
                .redirects(0)
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .set('Cookie', this.sessionCookie)
                .send({j_username: config.username, j_password: config.password + 'x'})
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.headers['set-cookie']).to.be.undefined;
                    expect(res.text).to.contain('<h1>Logon Failure</h1>');
                    done();
                });
    });
});

//------------------------------------------------------------------------------------------------
//                                Test Module Start
//------------------------------------------------------------------------------------------------
//Get the name of the most permissive trading role the current user has. This is useful when a
//client application wants to present role-specific options.
// Doesn't appear to Exist
describe('users/current/permissions/primary - Returning Empty text', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc;
    });
  });
  //marketDataRestUrl   dataMgmtRestUrl   orderMgmtRestUrl
  it('users/current/permissions/primary - Should return text', (done) => {
    request.get(config.dataMgmtRestUrl+'users/current/permissions/primary')
      .timeout(20000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'text/plain')
      .then( res => {
        //expect(res.status).to.equal(200);
        //expect(res.body).not.to.be.empty;
        //expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err);
        done();
      });
  });
});// /users/current/permissions/primary

xdescribe('currently returns an empty array orders/active', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc;
    });
  });
  
  it('currently returns an empty array orders/active', (done) => {
    request.get(config.orderMgmtRestUrl+'orders/active')
      .timeout(20000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
       // expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err);
        done();
      });
  });
});//

xdescribe('respond with a list of order events', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc;
    });
  });
  
  it('orders/events', (done) => {
    request.get(config.orderMgmtRestUrl+'orders/events')
      .timeout(20000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        //expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err);
        done();
      });
  });
});// orders events

/**
 * skip because use the old server name
 */
describe.skip('Works in Browser http://current.marx.tech:8080/omsrestservices/rest/accounts/1', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc;
    });
  });
  
  it('accounts{id} Returning Empty String', (done) => {
    request.get(config.orderMgmtRestUrl+'accounts/1')
      .timeout(20000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        //expect(res.status).to.eq(200)
        console.log(res.status);
        //expect(res.body).not.to.be.empty;
        done();
      })
      .catch( err => {
        console.log(err);
        done();
      });
  });
});

xdescribe('GET	/orders/eventsource/{type}', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc;
    });
  });
  
  it('GET	/orders/eventsource/{type}', (done) => {
    request.get(config.orderMgmtRestUrl+'orders/eventsource')
      .timeout(20000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        console.log(res.body);
        expect(res.body).not.to.be.empty;
        done();
      })
      .catch( err => {
        console.log(err);
        done();
      });
  });
});

describe('GET	/companies/{id}', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc;
    });
  });
  
  it('GET	/companies/{id}', (done) => {
    request.get(config.dataMgmtRestUrl+'companies/0')
      .timeout(20000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        //expect(res.body).not.to.be.empty;
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err);
        done();
      });
  });
});

describe.skip('GET	/companies/divisions/{id}', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc;
    });
  });
  
  it('GET	/companies/divisions/{id}', (done) => {
    request.get(config.dataMgmtRestUrl+'companies/divisions/2')
      .timeout(20000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.body).not.to.be.empty;
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err);
        done();
      });
  });
});


describe('/users/{id}', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc;
    });
  });

  it('users/{id}', (done) => {
    request.get(config.dataMgmtRestUrl+'users/2')
      .timeout(20000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
       expect(res.body).not.to.be.empty;
       //expect(res.userName).to.eq('test');
       console.log(res.body);
       done();
      })
      .catch( err => {
       // console.log(err)
        done();
      });
  });
});

// + 
//"routeString":"{\"description\":\"1\",\"level\":\"FOREXLEVEL1\",\"symbol\":\"EURUSD\",\"carrier
//\":\"MARX\",\"subtopic\":\"feedhandler:8787\",\"supplier\":\"MARX\",\"marketid\":2,\"protocol\":\"com
//.tradedesksoftware.feedhandler.feed.tcp.MarxFeed\"}
//responds with name, ownerId, companyId, map: [ 'java.util.ArrayList', [ [Object] ] ] }
describe('Get watchlist with id 1', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc;
    });
  });
  
  it('Respond with the json object for the watchlist', (done) => {
    request.get(config.dataMgmtRestUrl+'watchlist/1')
      .timeout(20000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        /*var jsonData = JSON.parse(res.body);
          for (var i = 0; i < jsonData.counters.length; i++) {
          var counter = jsonData.counters[i];
          console.log(counter.counter_name);
          }*/
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body.id).to.equal(1);
        expect(res.body.name).to.equal('one');
        //expect(res.body.map[1]).to.be.an('array');
        console.log(JSON.stringify(res.body));
        console.log(res.body.map[1]);
//        console.log(res.body);
        done();
        })
      .catch( err => {
        console.log(err);
        done();
      });
  });
});

describe('get account position for account with id = 3 (test / test)', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc;
    });
  });
  
  var accountID = 3;
  it('Respond with JSON object for the accountList', () =>{
      return request.get(config.orderMgmtRestUrl + 'accounts/' + accountID + '/positions')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', this.sessionCookies)
            .set('Accept', 'application/json')
            .then( res => {
                expect(res.status).to.equal(200);
                expect(res.body).not.to.be.empty;
                console.log(JSON.stringify(res.body));
            });
  });
});

/*
describe('POST	/orders/place', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('POST	/orders/place', (done) => {
    request.get(config.orderMgmtRestUrl+'orders/place')
      .timeout(20000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        console.log(res.body);
        expect(res.body).not.to.be.empty;
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});

POST	/orders/{id}/cancel
POST	/orders/{id}/replace
POST	/orders/{id}/undock
POST	/orders/dock

POST	/accounts/{id}/retireTickets
POST	/accounts/adjustments/new
POST	/accounts/new
POST	/destinations/info/save
POST	/destinations/save
POST	/exchanges/clone
POST	/exchanges/update
POST	/markups/update

POST	/symbols/all
POST	/symbols/carrier/saveMultiple
POST	/symbols/destination/saveMultiple
POST	/symbols/update
POST	/companies
POST	/companies/divisions
POST	/users/userinfo
POST	/watchlist/add
POST	/watchlist/delete
POST	/symbols/delete
POST	/symbols/delete
POST	/accounts/{id}/delete
POST	/accounts/{id}/deleteadjustments


*/

});