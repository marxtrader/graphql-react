const serverUrl = 'http://deploy.marx.tech:8080/';
const dataMgmtUrl = serverUrl + 'etsdatamanagement/';
const loginUrl = dataMgmtUrl+'j_security_check';

const dataMgmtRestUrl = serverUrl + 'etsdatamanagement/rest/';
const marketDataRestUrl = serverUrl + 'etsmarketdata/rest/';
const orderMgmtRestUrl = serverUrl + 'omsrestservices/rest/';

var loginPath;
var dashboardPath;
var privatePath;

if (process.env.NODE_ENV === 'localhost') {
    loginPath = '/react-graphql/login';
    dashboardPath = '/react-graphql/';
    privatePath = '/react-graphql/private';  
}else{
    loginPath = '/login';
    dashboardPath = '/';
    privatePath = '/private';  
}


module.exports = {
  serverUrl: serverUrl,
  dataMgmtUrl: dataMgmtUrl,
  loginUrl: loginUrl,
  dataMgmtRestUrl: dataMgmtRestUrl,
  marketDataRestUrl: marketDataRestUrl,
  orderMgmtRestUrl: orderMgmtRestUrl,
  username: 'test',
  password: 'test',
  loginPath: loginPath,
  dashboardPath: dashboardPath,
  privatePath: privatePath
};