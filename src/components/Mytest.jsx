'use strict';
import React from 'react';

let cookie;

const request = require('superagent');
const expect = require('chai').expect;
const config = require('./config');

//let sessionCookies;

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
                .timeout(5000)
                .then(getFirstCookie)
                .then(sessionCookie => {
                    request.post(config.loginUrl)
                            .timeout(5000)
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


const getWatchListIds = () => {
    return request.get(config.dataMgmtUrl + 'rest/watchlist/ids')
            .timeout(5000)
            .redirects(0)
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .then(res => {
                return res.body;
            });
};


const WatchList = (props) => {
    const items = props.data.map(item => {
        return (<li>{item.name}</li>);
    });

    return (
            <div className="panel panel-default">
              <div className="panel-heading">WATCHLIST</div>
              <div className="panel-body">
                <ul>
                  {items}
                </ul>
              </div>
            </div>
            );
};

export default WatchList;