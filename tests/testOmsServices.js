const mocha = require ('mocha'),
        describe = mocha.describe;
const chai = require('chai'),
        expect = chai.ecpect;

const omsSrv = require('../assets/js/services/tradingServer/omsservices.js');

// don't work since cross-domain calls
describe.skip('start test file testOmsServices', function () {
    
    describe('REST call getAccountPositions idacc = 3 without sending credentials', function () {
        
        return omsSrv.getAccountPositions(3);
        
    });
    
    
    
    
    
    
    
    
});
