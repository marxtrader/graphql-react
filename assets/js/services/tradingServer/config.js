const serverUrl = 'http://testing.marx.tech:8080/';
const dataMgmtUrl = serverUrl + 'etsdatamanagement/';
const loginUrl = dataMgmtUrl+'j_security_check';

const dataMgmtRestUrl = serverUrl + 'etsdatamanagement/rest/';
const marketDataRestUrl = serverUrl + 'etsmarketdata/rest/';
const orderMgmtRestUrl = serverUrl + 'omsrestservices/rest/';

//if ((process.env.NODE_ENV === 'testing') || (process.env.NODE_ENV === 'minimize')) {
//    
//}
//const DEBUG_REMOTE = ((process.env.NODE_ENV === 'testing') ? (true) : (false));
//const MINIMIZE_CODE = 

module.exports = {
  serverUrl: serverUrl,
  dataMgmtUrl: dataMgmtUrl,
  loginUrl: loginUrl,
  dataMgmtRestUrl: dataMgmtRestUrl,
  marketDataRestUrl: marketDataRestUrl,
  orderMgmtRestUrl: orderMgmtRestUrl,
  username: 'test',
  password: 'test'
};