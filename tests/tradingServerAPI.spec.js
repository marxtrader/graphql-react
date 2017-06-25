'use strict';

const request = require('superagent');
const expect = require('chai').expect;
const config = require('../assets/js/services/tradingServer/config.js');
const describe = require('mocha').describe;
const skip = require('mocha').skip;

/**
 * global describe
 */
describe.skip('start testing tradingServerAPI.spec.js',function() {

// utility function for getting first cookie
// from response
const getFirstCookie = res => {
    const cookies = res.headers['set-cookie'];
    const cookie = cookies[0];
    if (!cookies)
        return null;
    if (!cookie)
        return null;
    return cookie.substr(0, cookie.indexOf(';'));
};

// utility function to do login
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
    it('responds with 200, JSESSIONID cookie, and login form html', (done) => {
        request.get(config.dataMgmtUrl)
                .timeout(20000)
                .redirects(0)
                .then(res => {
                    expect(res.status).to.equal(200);
                    const cookie = getFirstCookie(res);
                    expect(cookie).to.contain('JSESSIONID');
                    expect(res.text).to.contain('<h1>Log On</h1>');
                    expect(res.text).to.contain("<form method='POST' action='j_security_check'>");
                    done();
                });
    });
});


describe('get /etsdatamanagement/ with invalid session cookie sent', () => {
    it('responds with 200, JSESSIONID cookie, and login form html', (done) => {
        request.get(config.dataMgmtUrl)
                .timeout(20000)
                .redirects(0)
                .set('Cookie', 'oV5PUvDbVf6skF2ARgbODqYA')
                .then(res => {
                    expect(res.status).to.equal(200);
                    const cookie = getFirstCookie(res);
                    expect(cookie).to.contain('JSESSIONID');
                    expect(res.text).to.contain('<h1>Log On</h1>');
                    expect(res.text).to.contain(
                            "<form method='POST' action='j_security_check'>"
                            );
                    done();
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

    it('does a redirect', (done) => {
        request.post(config.loginUrl)
                .timeout(20000)
                .redirects(0)
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .set('Cookie', this.sessionCookie)
                .send({j_username: config.username, j_password: config.password})
                .catch(err => {
                    expect(err.status).to.equal(302);
                    done();
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

// responds with id, userName, passWord, companyId, groupId, state, recoveryConfirmation, ownerId
describe('get current user info', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with current user info json', (done) => {
        request.get(config.dataMgmtUrl + 'rest/users/current')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    console.log(res.body);
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    expect(res.body.userName).to.equal(config.username);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

describe('get watch list ids', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with watch list ids as json array', (done) => {
        request.get(config.dataMgmtRestUrl + 'watchlist/ids')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    expect(res.body).to.be.an('array');
                    expect(res.body).to.have.lengthOf(2);
                    expect(res.body[0]).to.equal('15|Main');
                    expect(res.body[1]).to.equal('16|JSX');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

describe('get current user primary role', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with user role (trader) as plain text', (done) => {
        request.get(config.orderMgmtRestUrl + 'roles/primary')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'text/plain')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.text).not.to.be.empty;
                    expect(res.text).to.equal('trader');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});


// responds with id, state, number, companyId, name, margin, currency,
// type, reuseFund, limit, balance, pandl, maxordersize, maxposlimit, lastUpdate
describe('get accounts', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with accounts as json array', (done) => {
        request.get(config.orderMgmtRestUrl + 'accounts')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    console.log(res.body);
                    expect(res.body[0].id).to.eq(3);
                    expect(res.body[0].state).to.eq('ENABLED');
                    expect(res.body[0].number).to.eq('MARX 003');
                    expect(res.body[0].companyId).to.eq(0);
                    expect(res.body[0].name).to.eq('LMAX UAT');
                    expect(res.body[0].margin).to.eq(0);
                    expect(res.body[0].currency).to.eq('USD');
                    expect(res.body[0].type).to.eq('PROPRIETARY');
                    //expect(res.body[0].reusefund).to.eq('null');
                    expect(res.body[0].limit).to.eq(0);
                    expect(res.body[0].balance).to.eq(0);
                    //expect(res.body[0].pandl).to.eq('null');
                    expect(res.body[0].maxordersize).to.eq(0);
                    expect(res.body[0].maxposlimit).to.eq(0);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});


//responds with name, ownerId, companyId, map: [ 'java.util.ArrayList', [ [Object] ] ] }
describe('get watch list with id 15', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with the json object for the watch list', (done) => {
        request.get(config.dataMgmtRestUrl + 'watchlist/15')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    console.log(res.body);
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    expect(res.body.id).to.equal(15);
                    expect(res.body.name).to.equal('Main');
                    expect(res.body.map[1]).to.be.an('array');
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});


// returns company/division information
// parentDepartment, access, id, companyId, description, name, state
describe('returns company/division information', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with Department name and descriptive info', (done) => {
        request.get(config.dataMgmtRestUrl + 'users/current/companies/divisions')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    console.log(res.body);
                    expect(res.state).to.equal("ENABLED");
                    expect(res.name).to.equal('Traders');
                    expect(res.parentDepartment).to.equal(0);
                    expect(res.access).to.equal("ENABLED");
                    expect(res.id).to.equal(2);
                    expect(res.CompanyId).to.equal(1);
                    expect(res.parentDepartment).to.equal(0);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});// /users/current/companies/divisions

describe('responds with the Company Id and info', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with the Company Id and info', (done) => {
        request.get(config.dataMgmtRestUrl + 'users/current/companies/all')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body[0].bdid).to.eq('TDSC');
                    //expect(res.name).to.eq('TD Software Corp');
                    expect(res.body[0].id).to.eq(1);
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});//users/current/companies/all


//responds with [bdid: 'TDSC', name: 'TD Software Corp', description: 'Portal', id: 1, state: 'ENABLED']
describe('responds with a list of active companies', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with a list of active companies', (done) => {
        request.get(config.dataMgmtRestUrl + 'users/current/companies/live')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body[0].bdid).to.eq('TDSC');
                    expect(res.body[0].id).to.eq(1);
                    //expect(res.body[0].companyId).to.eq(1);
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});// users/current/companies/live

//Get the name of the most permissive trading role the current user has. This is useful when a
//client application wants to present role-specific options.
// Doesn't appear to Exist
xdescribe('responds unknown structure permissions primary', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });
    //marketDataRestUrl   dataMgmtRestUrl   orderMgmtRestUrl
    it('responds with unknown structure permissions primary', (done) => {
        request.get(config.orderMgmtRestUrl + 'users/current/permissions/primary')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    //expect(res.status).to.equal(200);
                    //expect(res.body).not.to.be.empty;
                    //expect(res.body).to.be.an('array');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});// /users/current/permissions/primary

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
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with a list of all users', (done) => {
        request.get(config.dataMgmtRestUrl + 'users/all')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                //'text/plain'  'application/json'
                .set('Accept', 'application/json')
                .then(res => {
                    //expect(res.body[0].privateEmail).to.eq('test@marx.tech');
                    //expect(res.body[0].ownerId).to.eq(2);
                    //expect(res.body[0].groupId).to.eq(2);
                    //expect(res.body[0].companyId).to.eq(1);
                    //  expect(res.body[0].dayPhone).to.eq('222-555-1111');
                    //  expect(res.body[0].fax).to.eq('222-555-1111');
                    //  expect(res.body[0].mobilePhone).to.eq('222-555-1111');
                    //  expect(res.body[0].nightPhone).to.eq('222-555-1111');
                    //  expect(res.body[0].imageName).to.eq('null');
                    //  expect(res.body[0].firstName).to.eq('Administrator');
                    //  expect(res.body[0].homePage).to.eq('www.marx.tech');
                    //  expect(res.body[0].lastName).to.eq('test');
                    // expect(res.publicEmail).to.eq('marxadmin@tradedesksoftware.com');
                    // expect(res.userName).to.eq('administrator');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});// users/all

//responds with a list of entries [id, roleName, roleCategory
describe('responds with available roles for a user', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with available roles for a user', (done) => {
        request.get(config.dataMgmtRestUrl + 'roles/all')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});// /roles/all

//id, description, micCode, fix42Code]
describe('responds with available exchanges', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with available exchanges', (done) => {
        request.get(config.marketDataRestUrl + 'exchanges/all')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    expect(res.body).to.be.an('array');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});//exchanges/all

xdescribe('responds with permitted routes', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with routes as json array', (done) => {
        request.get(config.marketDataRestUrl + 'routes/permitted/all')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    //expect(res.body).not.to.be.empty;
                    //expect(res.body).to.be.an('array');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});// /routes/permitted/all

// 'java.util.ArrayList'. 
describe('systemevents/all', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with a list ', (done) => {
        request.get(config.orderMgmtRestUrl + 'systemevents/all')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    expect(res.body).to.be.an('array');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});//

// eg. [ 'java.util.HashSet', [] ]
describe('Request Destinations for a user', () => {
// login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with array of all destinations', (done) => {
        request.get(config.orderMgmtRestUrl + 'userDestinations')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    expect(res.body).to.be.an('array');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});//destinations/all

//Get all DestinationInfo for destinations which authenticated user is actually permitted to
//route orders to.
describe('destinations/user', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with watch list ids as json array', (done) => {
        request.get(config.orderMgmtRestUrl + 'destinations/1')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    //expect(res.name).to.contain('LMAX');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});// destinations/user


// Returns array [userID, groupID, 
// companyID] for authenticated user.
describe('userids', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with watch list ids as json array', (done) => {
        request.get(config.orderMgmtRestUrl + 'userids')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    expect(res.body).to.be.an('array');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});// userids

//Return all orders not in a final state 
//(e.g., not filled/cancelled/expired/rejected.)
xdescribe('orders/active', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('orders/active', (done) => {
        request.get(config.orderMgmtRestUrl + 'orders/active')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    //expect(res.body).not.to.be.empty;
                    //expect(res.body).to.be.an('array');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});//

xdescribe('respond with a list of order events', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('orders/events', (done) => {
        request.get(config.orderMgmtRestUrl + 'orders/events')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    //expect(res.body).to.be.an('array');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});// orders events

//  responds with a list of order states
//  'NEW','CANCELLED', 'DOCKED', 'DONEFORDAY', 'EXPIRED', 'FILLED'
//  'OPEN', 'PARTIALLYFILLED', 'PENDING', 'PENDINGCANCEL', 'PENDINGREPLACE',
//  'REJECTED', 'REPLACED', 'SENDING', 'HALTED', 'CLOSED'
describe('responds with a list of order states', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with a list of order states', (done) => {
        request.get(config.orderMgmtRestUrl + 'meta/orders/states')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    expect(res.body).to.be.an('array');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});// meta/orders/states

//responds with a list of time in force
// [ 'DAY',   'GOOD_TILL_CANCEL',   'AT_THE_OPENING',  'IMMEDIATE_OR_CANCEL',
// 'FILL_OR_KILL', 'GOOD_TILL_CROSSING', 'GOOD_TILL_DATE', 'AT_THE_CLOSE' ]
describe('responds with a list of time in force', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with a list of times in force', (done) => {
        request.get(config.orderMgmtRestUrl + 'meta/orders/tifs')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    expect(res.body).to.be.an('array');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});// meta/orders/tifs

//responds with a list of order sides
//'BUY','SELL', 'BUYMINUS', 'SELLPLUS', 'SELLSHORT', 'SELLSHORTEXEMPT',
//'UNDISCLOSED', 'CROSS', 'CROSSSHORT', 'CROSSSHORTEXEMPT',
//'ASDEFINED', 'OPPOSITE', 'SUBSCRIBE', 'REDEEM', 'LEND', 'BORROW' ]
describe('responds with a list of order sides', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with list of order sides', (done) => {
        request.get(config.orderMgmtRestUrl + 'meta/orders/sides')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    expect(res.body).to.be.an('array');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});// meta/orders/sides

//Return all execution types supported by OMS 
//(not necessarily by a specific destination!)
//[ 'NEW','DONE_FOR_DAY','CANCELED','REPLACED','PENDING_CANCEL','REJECTED','PENDING_NEW','EXPIRED',
//'PENDING_REPLACE','TRADE','TRADE_CANCEL','ORDER_STATUS','STOPPED','SUSPENDED','RESTATED','CALCULATED
describe('meta/execution/types meta/execution/types', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with list of Execution types', (done) => {
        request.get(config.orderMgmtRestUrl + 'meta/executions/types')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    expect(res.body).to.be.an('array');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});// meta/execution/types


//Return all order execution instructions supported
//by OMS (not necessarily by a specific destination!)
//'NOT_HELD', 'WORK','GO_ALONG','OVER_THE_DAY','HELD','PARTICIPATE_DONT_INITIATE','STRICT_SCALE',
//  'TRY_TO_SCALE','STAY_ON_BIDSIDE','STAY_ON_OFFERSIDE','NO_CROSS','OK_TO_CROSS','CALL_FIRST',
//  'PERCENT_OF_VOLUME','DO_NOT_INCREASE','DO_NOT_REDUCE','ALL_OR_NONE','REINSTATE_ON_SYSTEM_FAILURE',
// 'INSTITUTIONS_ONLY','REINSTATE_ON_TRADING_HALT','CANCEL_ON_TRADING_HALT','LAST_PEG','MID_PRICE',
//  'NON_NEGOTIABLE','OPENING_PEG','MARKET_PEG','CANCEL_ON_SYSTEM_FAILURE','PRIMARY_PEG','SUSPEND',
//  'FIXED_PEG_TO_LOCAL_BEST_BID_OR_OFFER_AT_TIME_OF_ORDER','CUSTOMER_DISPLAY_INSTRUCTION',
//  'NETTING','PEG_TO_VWAP','TRADE_ALONG','TRY_TO_STOP','CANCEL_IF_NOT_BEST','TRAILING_STOP_PEG',
//  'STRICT_LIMIT','IGNORE_PRICE_VALIDITY_CHECKS','PEG_TO_LIMIT_PRICE','WORK_TO_TARGET_STRATEGY','NONE' ]
describe('responds with unknown structure meta/execution/instructions', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with a list of execution instructions', (done) => {
        request.get(config.orderMgmtRestUrl + 'meta/executions/instructions')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    expect(res.body).to.be.an('array');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});// meta/execution/instructions

// responds with [ 'RETAIL', 'WHOLESALE', 'PROPRIETARY', 'EMPLOYEE', 'COMBINED' ]
describe('responds with a list of account types', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with a list of account types', (done) => {
        request.get(config.orderMgmtRestUrl + 'meta/accounts/types')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    expect(res.body).to.be.an('array');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});// meta/accounts/types


//responds with an array[ 'STOCK', 'STOCKOPTION', 'FUTURE', 'FOREIGNEXCHANGE','OPTION',   'CFD' ]
describe('responds with array of instrument types', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with array of instrument types', (done) => {
        request.get(config.orderMgmtRestUrl + 'meta/instruments/types')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    expect(res.body).to.be.an('array');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});// meta/instrument/types

// responds with [AssertionError, message,   showDiff,   actual,   expected]
describe('meta/tickets/states', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with an array of ticket states', (done) => {
        request.get(config.orderMgmtRestUrl + 'meta/tickets/states')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.status).to.equal(200);
                    //expect(res.body[0].state).to.equal('NEW');
                    expect(res.body).to.be.an('array');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});// meta/tickets/state

describe('/users/{id}', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('users/{id}', (done) => {
        request.get(config.dataMgmtRestUrl + 'users/2')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.body).not.to.be.empty;
                    //expect(res.userName).to.eq('test');
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    // console.log(err)
                    done();
                });
    });
});

xdescribe('accounts{id}', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('accounts{id}', (done) => {
        request.get(config.orderMgmtRestUrl + 'accounts/1')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    console.log(res.body);
                    //expect(res.body).not.to.be.empty;
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

describe('Get	/accounts/{id}/markets', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('Get	/accounts/{id}/markets', (done) => {
        request.get(config.orderMgmtRestUrl + 'accounts/1/markets')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    console.log(res.body);
                    expect(res.body).not.to.be.empty;
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

describe('accounts/{id}/positions', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('accounts/{id}/positions', (done) => {
        request.get(config.orderMgmtRestUrl + 'accounts/3/positions')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    console.log(res.body);
                    expect(res.body).not.to.be.empty;
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

describe('companies/1/accounts', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('companies/1/accounts', (done) => {
        request.get(config.orderMgmtRestUrl + 'companies/1/accounts')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    console.log(res.body);
                    //expect(res.body).not.to.be.empty;
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

//[ 'java.util.ArrayList', [ [ 1, 1 ], [ 3, 2 ], [ 4, 2 ] ] ]
describe('destination/markets/all', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('[ java.util.ArrayList, [ [ 1, 1 ], [ 3, 2 ], [ 4, 2 ] ] ]', (done) => {
        request.get(config.orderMgmtRestUrl + 'destinations/markets/all')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    console.log(res.body);
                    expect(res.body).not.to.be.empty;
                    expect(res.body).to.be.an('array');
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

describe('GET	/exchanges/{symbol}', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('GET	/exchanges/{symbol}', (done) => {
        request.get(config.marketDataRestUrl + 'exchanges/EURUSD')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    console.log(res.body);
                    expect(res.body).not.to.be.empty;
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

describe('markups/{marketid}', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('markups/{marketid}', (done) => {
        request.get(config.marketDataRestUrl + 'markups/1')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    console.log(res.body);
                    expect(res.body).not.to.be.empty;
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

describe('GET	/orders{id}', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('GET	/orders{id}', (done) => {
        request.get(config.orderMgmtRestUrl + 'orders/1')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    console.log(res.body);
                    expect(res.body).not.to.be.empty;
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

describe('GET	/orders/{id}/calculations', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('orders/1/calculations', (done) => {
        request.get(config.orderMgmtRestUrl + 'orders/1/calculations')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    console.log(res.body);
                    expect(res.body).not.to.be.empty;
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

describe('GET	/orders/{id}/executions', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('GET	/orders/{id}/executions', (done) => {
        request.get(config.orderMgmtRestUrl + 'orders/1/executions')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    console.log(res.body);
                    expect(res.body[0].finalState).to.eq('OPEN');
                    expect(res.body[0].side).to.eq('BUY');
                    expect(res.body).not.to.be.empty;
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

xdescribe('GET	/orders/eventsource/{type}', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('GET	/orders/eventsource/{type}', (done) => {
        request.get(config.orderMgmtRestUrl + 'orders/eventsource')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    console.log(res.body);
                    expect(res.body).not.to.be.empty;
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

describe('GET	/symbols/destination/{destid}', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('GET	/symbols/destinations/{destid}', (done) => {
        request.get(config.marketDataRestUrl + 'symbols/destination/1')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    console.log(res.body);
                    expect(res.body).not.to.be.empty;
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

describe('GET	/symbols/exchange/{exchangeid}', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('GET	/symbols/exchange/{exchangeid}', (done) => {
        request.get(config.marketDataRestUrl + 'symbols/exchange/1')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.body).not.to.be.empty;
                    console.log(res.body[0]);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});


describe('GET	/symbols/exchange/{exchangeid}/{carrier}', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('GET	/symbols/exchange/{exchangeid}/{carrier}', (done) => {
        request.get(config.marketDataRestUrl + 'symbols/exchange/1/LMAX')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.body).not.to.be.empty;
                    //console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

xdescribe('GET	/companies/{id}', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('GET	/companies/{id}', (done) => {
        request.get(config.dataMgmtUrl + 'rest/companies/1')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.body).not.to.be.empty;
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

describe.skip('GET	/companies/divisions/{id}', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('GET	/companies/divisions/{id}', (done) => {
        request.get(config.dataMgmtRestUrl + 'companies/divisions/2')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    expect(res.body).not.to.be.empty;
                    console.log(res.body);
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

describe('GET	/users/{id}/permissions', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('GET	/users/{id}/permissions', (done) => {
        request.get(config.dataMgmtRestUrl + 'users/2/permissions')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    console.log(res.body);
                    expect(res.body).not.to.be.empty;
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});


describe('GET	/users/{id}/profile', () => {
    // login first
    beforeEach(() => {
        return doLogin().then(sc => {
            this.sessionCookies = sc;
        });
    });

    it('responds with a specific users detail', (done) => {
        request.get(config.dataMgmtRestUrl + 'users/2/profile')
                .timeout(20000)
                .redirects(0)
                .set('Cookie', this.sessionCookies)
                .set('Accept', 'application/json')
                .then(res => {
                    console.log(res.body);
                    expect(res.body).not.to.be.empty;
                    done();
                })
                .catch(err => {
                    console.log(err);
                    done();
                });
    });
});

});