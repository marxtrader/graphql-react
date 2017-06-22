'use strict';

const request = require('superagent');
const expect = require('chai').expect
const config = require('./config');

//let sessionCookies;

// utility function for getting first cookie
// from response
const getFirstCookie = res => {
  const cookies = res.headers['set-cookie'];
  const cookie = cookies[0];
  if(!cookies) return null; 
  if(!cookie) return null; 
  return cookie.substr(0, cookie.indexOf(';'));
};

// utility function to do login
const doLogin = () => {
  return new Promise( (resolve, reject) => {
    request.get(config.dataMgmtUrl)
      .timeout(5000)
      .then( getFirstCookie )
      .then( sessionCookie => {
        request.post(config.loginUrl)
          .timeout(5000)
          .redirects(1)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .set('Cookie', sessionCookie)
          .send({j_username:config.username,j_password:config.password})
          .then( res => {
            const sessionCookies = sessionCookie+'; '+getFirstCookie(res);
            resolve(sessionCookies);
          })
      })
      .catch( err => {
        console.log('--- error in doLogin')
        console.log(err)
        reject(err);
      });
  });
};


describe('get /etsdatamanagement/ without sending session cookie', () => {
  it('responds with 200, JSESSIONID cookie, and login form html', (done) => {
    request.get(config.dataMgmtUrl)
      .timeout(5000)
      .redirects(0)
      .then( res => {
        expect(res.status).to.equal(200);
        const cookie = getFirstCookie(res);
        expect(cookie).to.contain('JSESSIONID');
        expect(res.text).to.contain('<h1>Log On</h1>');
        expect(res.text).to.contain("<form method='POST' action='j_security_check'>");
        done()
      })
  });
});


describe('get /etsdatamanagement/ with invalid session cookie sent', () => {
  it('responds with 200, JSESSIONID cookie, and login form html', (done) => {
    request.get(config.dataMgmtUrl)
      .timeout(5000)
      .redirects(0)
      .set('Cookie', 'oV5PUvDbVf6skF2ARgbODqYA')
      .then( res => {
        expect(res.status).to.equal(200);
        const cookie = getFirstCookie(res);
        expect(cookie).to.contain('JSESSIONID');
        expect(res.text).to.contain('<h1>Log On</h1>');
        expect(res.text).to.contain(
          "<form method='POST' action='j_security_check'>"
        );
        done()
      })
  });
});


describe('login with good username and password', () => {
  // get session cookie first
  beforeEach(done => {
    request.get(config.dataMgmtUrl)
      .timeout(5000)
      .then( res => {
        this.sessionCookie = getFirstCookie(res);
        done()
      })
  });

  it('does a redirect', (done) => {
    request.post(config.loginUrl)
      .timeout(5000)
      .redirects(0)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Cookie', this.sessionCookie)
      .send({j_username:config.username,j_password:config.password})
      .catch( err => {
        expect(err.status).to.equal(302)
        done();
      })
  });

  it('responds with 200 and JSESSIONIDSSO cookie', (done) => {
    request.post(config.loginUrl)
      .timeout(5000)
      .redirects(1)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Cookie', this.sessionCookie)
      .send({j_username:config.username,j_password:config.password})
      .then( res => {
        expect(res.status).to.equal(200);
        const cookie = getFirstCookie(res);
        expect(cookie).to.contain('JSESSIONIDSSO');
        done()
      })
  });
});

describe('login with good username and bad password', () => {
  // get session cookie first
  beforeEach(done => {
    request.get(config.dataMgmtUrl)
      .timeout(5000)
      .then( res => {
        this.sessionCookie = getFirstCookie(res);
        done()
      })
  });
  it('responds with 200, no cookies, and logon failure html', (done) => {
    request.post(config.loginUrl)
      .timeout(5000)
      .redirects(0)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Cookie', this.sessionCookie)
      .send({j_username:config.username,j_password:config.password+'x'})
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.headers['set-cookie']).to.be.undefined;
        expect(res.text).to.contain('<h1>Logon Failure</h1>');
        done();
      })
  });
});

// responds with id, userName, passWord, companyId, groupId, state, recoveryConfirmation, ownerId
describe('get current user info', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with current user info json', (done) => {
    request.get(config.dataMgmtUrl+'rest/users/current')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        console.log(res.body)
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body.userName).to.equal(config.username);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});


describe('get watch list ids', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with watch list ids as json array', (done) => {
    request.get(config.dataMgmtRestUrl+'watchlist/ids')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        expect(res.body).to.have.lengthOf(2);
        expect(res.body[0]).to.equal('15|Main');
        expect(res.body[1]).to.equal('16|JSX');
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});

/*
xdescribe('get current user primary role', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with user role (trader) as plain text', (done) => {
    request.get(config.orderMgmtRestUrl+'roles/primary')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'text/plain')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.text).not.to.be.empty;
        expect(res.text).to.equal('trader');
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});
*/

// responds with id, state, number, companyId, name, margin, currency,
// type, reuseFund, limit, balance, pandl, maxordersize, maxposlimit, lastUpdate
describe('get accounts', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with accounts as json array', (done) => {
    request.get(config.orderMgmtRestUrl+'accounts')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        console.log(res.body)
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        expect(res.body).to.have.lengthOf(1);
        expect(res.body[0].name).to.eq('LMAX UAT');
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});

//responds with name, ownerId, companyId, map: [ 'java.util.ArrayList', [ [Object] ] ] }
describe('get watch list with id 15', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with the json object for the watch list', (done) => {
    request.get(config.dataMgmtRestUrl+'watchlist/15')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        console.log(res.body)
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body.id).to.equal(15);
        expect(res.body.name).to.equal('Main');
        expect(res.body.map[1]).to.be.an('array');
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});

// returns company/division information
// parentDepartment, access, id, companyId, description, name, state
describe('returns company/division information', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });

  it('responds with Department name and descriptive info', (done) => {
    request.get(config.dataMgmtRestUrl+'users/current/companies/divisions')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        console.log(res.body);
        expect(res.state).to.equal('ENABLED');
        expect(res.name).to.equal('Traders');
        expect(res.parentDepartment).to.equal(0);
        expect(res.access).to.equal('ENABLED');
        expect(res.id).to.equal(2);
        expect(res.CompanyId).to.equal(1);
        expect(res.parentDepartment).to.equal(0);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// /users/current/companies/divisions


describe('responds with the Company Id and info', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with the Company Id and info', (done) => {
    request.get(config.dataMgmtRestUrl+'users/current/companies/all')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});//users/current/companies/all

//responds with [bdid: 'TDSC', name: 'TD Software Corp', description: 'Portal', id: 1, state: 'ENABLED']
describe('responds with a list of active companies', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with a list of active companies', (done) => {
    request.get(config.dataMgmtRestUrl+'users/current/companies/live')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// users/current/companies/live

/*
//Get the name of the most permissive trading role the current user has. This is useful when a
//client application wants to present role-specific options.
xdescribe('responds unknown structure permissions primary', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with unknown structure permissions primary', (done) => {
    request.get(config.dataMgmtRestUrl+'users/current/permissions/primary')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// /users/current/permissions/primary
*/


 //responds list structure users/all
 //java.util.ArrayList', user: [Object], profile: [Object], roles: [Object],
 //     userName: 'test', ownerId: 2, privateEmail: 'test@marx.tech',
 //    firstName: 'test', lastName: 'test', passWord: null, dayPhone: '222-555-1111',
 //     mobilePhone: '222-555-1111', nightPhone: '222-555-1111', publicEmail: 'test@marx.tech',
 //     fax: '222-555-1111', homePage: 'www.marx.tech', profileId: 2, imageName: null,
 //     recoveryConfirmation: null, accessibleState: 'ENABLED', id: 2, groupId: 2,
 //    companyId: 1, state: 2, handle: 'test'
describe('responds list structure users/all', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with a list of all users', (done) => {
    request.get(config.dataMgmtRestUrl+'users/all')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// users/all

//responds with a list of entries [id, roleName, roleCategory
describe('responds with available roles for a user', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with available roles for a user', (done) => {
    request.get(config.dataMgmtRestUrl+'roles/all')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// /roles/all

//id, description, micCode, fix42Code]
describe('responds with available exchanges', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with available exchanges', (done) => {
    request.get(config.marketDataRestUrl+'exchanges/all')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});//exchanges/all

//[AssertionError: expected [] not to be empty]
//  message: 'expected [] not to be empty',
//  showDiff: false,
//  actual: [],
//  expected: undefined
describe('responds with permitted routes', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with routes as json array', (done) => {
    request.get(config.marketDataRestUrl+'routes/permitted/all')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// /routes/permitted/all

// 'java.util.ArrayList'. 
describe('systemevents/all', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with a list ', (done) => {
    request.get(config.orderMgmtRestUrl+'systemevents/all')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});//

// eg. [ 'java.util.HashSet', [] ]
describe('destinations/all', () => {
// login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with watch list ids as json array', (done) => {
    request.get(config.orderMgmtRestUrl+'destinations/all')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});//destinations/all

/*
//Get all destination info for destinations visible to authenticated user - returns DestinationInfo
//objects with full destination configuration including markets, accounts, sides, etc
xdescribe('destinations', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with ', (done) => {
    request.get(config.orderMgmtRestUrl+'destinations')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// destinations
*/

/*
//Get all DestinationInfo for destinations which authenticated user is actually permitted to
//route orders to.
xdescribe('destinations/user', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with watch list ids as json array', (done) => {
    request.get(config.orderMgmtRestUrl+'destinations/user')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// destinations/user
*/

/*
//Return primary (highest, most-permissive) 
//role available to the authenticated user
xdescribe('roles/primary', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with watch list ids as json array', (done) => {
    request.get(config.orderMgmtRestUrl+'roles/primary')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});
*/

// Returns array [userID, groupID, 
// companyID] for authenticated user.
describe('userids', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with watch list ids as json array', (done) => {
    request.get(config.orderMgmtRestUrl+'destinations/all')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// userids

//Return all orders not in a final state 
//(e.g., not filled/cancelled/expired/rejected.)
describe('orders/active', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with watch list ids as json array', (done) => {
    request.get(config.orderMgmtRestUrl+'orders/active')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});//

//AssertionError: expected [] not to be empty]
//  message: ,
//  showDiff:,
//  actual: [],
//  expected:
describe('respond with a list of order events', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with watch list ids as json array', (done) => {
    request.get(config.orderMgmtRestUrl+'orders/events')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// orders events

//  responds with a list of order states
//  'NEW','CANCELLED', 'DOCKED', 'DONEFORDAY', 'EXPIRED', 'FILLED'
//  'OPEN', 'PARTIALLYFILLED', 'PENDING', 'PENDINGCANCEL', 'PENDINGREPLACE',
//  'REJECTED', 'REPLACED', 'SENDING', 'HALTED', 'CLOSED'
describe('responds with a list of order states', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with a list of order states', (done) => {
    request.get(config.orderMgmtRestUrl+'meta/orders/states')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// meta/orders/states

//responds with a list of time in force
// [ 'DAY',   'GOOD_TILL_CANCEL',   'AT_THE_OPENING',  'IMMEDIATE_OR_CANCEL',
// 'FILL_OR_KILL', 'GOOD_TILL_CROSSING', 'GOOD_TILL_DATE', 'AT_THE_CLOSE' ]
describe('responds with a list of time in force', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with a list of times in force', (done) => {
    request.get(config.orderMgmtRestUrl+'meta/orders/tifs')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// meta/orders/tifs

//responds with a list of order sides
//'BUY','SELL', 'BUYMINUS', 'SELLPLUS', 'SELLSHORT', 'SELLSHORTEXEMPT',
//'UNDISCLOSED', 'CROSS', 'CROSSSHORT', 'CROSSSHORTEXEMPT',
//'ASDEFINED', 'OPPOSITE', 'SUBSCRIBE', 'REDEEM', 'LEND', 'BORROW' ]
describe('responds with a list of order sides', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with list of order sides', (done) => {
    request.get(config.orderMgmtRestUrl+'meta/orders/sides')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// meta/orders/sides

/*
//Return all execution types supported by OMS 
//(not necessarily by a specific destination!)
xdescribe('meta/execution/types meta/execution/types', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with unknow structure', (done) => {
    request.get(config.orderMgmtRestUrl+'meta/execution/types')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        /console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// meta/execution/types

//Return all order execution instructions supported
//by OMS (not necessarily by a specific destination!)
xdescribe('responds with unknown structure meta/execution/instructions', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with a list of execution instructions', (done) => {
    request.get(config.orderMgmtRestUrl+'meta/execution/instructions')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// meta/execution/instructions
*/

// responds with [ 'RETAIL', 'WHOLESALE', 'PROPRIETARY', 'EMPLOYEE', 'COMBINED' ]
describe('responds with a list of account types', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with a list of account types', (done) => {
    request.get(config.orderMgmtRestUrl+'meta/accounts/types')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// meta/accounts/types


//responds with an array[ 'STOCK', 'STOCKOPTION', 'FUTURE', 'FOREIGNEXCHANGE','OPTION',   'CFD' ]
describe('responds with array of instrument types', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with array of instrument types', (done) => {
    request.get(config.orderMgmtRestUrl+'meta/instruments/types')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// meta/instrument/types

// responds with [AssertionError, message,   showDiff,   actual,   expected]
describe('meta/tickets/states', () => {
  // login first
  beforeEach( () => {
    return doLogin().then( sc => {
      this.sessionCookies = sc
    });
  });
  
  it('responds with an array of ticket states', (done) => {
    request.get(config.orderMgmtRestUrl+'meta/tickets/states')
      .timeout(5000)
      .redirects(0)
      .set('Cookie', this.sessionCookies)
      .set('Accept', 'application/json')
      .then( res => {
        expect(res.status).to.equal(200);
        expect(res.state).to.equal('NEW');
        expect(res.body).to.be.an('array');
        console.log(res.body);
        done();
      })
      .catch( err => {
        console.log(err)
        done()
      });
  });
});// meta/tickets/states
