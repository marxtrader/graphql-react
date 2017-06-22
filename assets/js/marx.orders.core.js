/**
 * Core methods for order handling used by other methods.  Relies on REST services.
 */

var ordTIFs = {
    0:"DAY",
    1:"GOOD_TILL_CANCEL",
    2:"AT_THE_OPENING",
    3:"IMMEDIATE_OR_CANCEL",
    4:"FILL_OR_KILL",
    5:"GOOD_TILL_CROSSING",
    6:"GOOD_TILL_DATE",
    7:"AT_THE_CLOSE"
};
 
var ordTypes = {	 
    0:"MARKET",
    1:"LIMIT",
    2:"STOP",
    3:"STOP_LIMIT",
    4:"MARKET_ON_CLOSE",
    5:"WITH_OR_WITHOUT",
    6:"LIMIT_OR_BETTER",
    7:"LIMIT_WITH_OR_WITHOUT",
    8:"ON_BASIS",
    9:"ON_CLOSE",
    10:"LIMIT_ON_CLOSE", 
    11:"FOREX_MARKET",
    12:"PREVIOUSLY_QUOTED",
    13:"PREVIOUSLY_INDICATED",
    14:"FOREX_LIMIT",
    15:"FOREX_SWAP",
    16:"FOREX_PREVIOUSLY_QUOTED",
    17:"FUNARI",
    18:"MARKET_IF_TOUCHED",
    19:"MARKET_WITH_LEFTOVER_AS_LIMIT",
    20:"PREVIOUS_FUND_VALUATION_POINT",
    21:"NEXT_FUND_VALUATION_POINT",
    22:"PEGGED",
    23:"ONE_CANCELS_OTHER",
    24:"IF_DONE",
    25:"IF_DONE_ONE_CANCELS_OTHER"
};

var ordSides = {
    0:"BUY",
    1:"SELL",
    2:"BUYMINUS",
    3:"SELLPLUS",
    4:"SELLSHORT",
    5:"SELLSHORTEXEMPT",
    6:"UNDISCLOSED",
    7:"CROSS",
    8:"CROSSSHORT",
    9:"CROSSSHORTEXEMPT",
    10:"ASDEFINED",
    11:"OPPOSITE",
    12:"SUBSCRIBE",
    13:"REDEEM",
    14:"LEND",
    15:"BORROW"	
};

var ordInstTypes = {
    0:"STOCK",
    1:"STOCKOPTION",
    2:"FUTURE",
    3:"FOREIGNEXCHANGE",
    4:"OPTION",
    5:"CFD"
};

var accountTypes = {
	0:"RETAIL", 
	1:"WHOLESALE", 
	2:"PROPRIETARY", 
	3:"EMPLOYEE", 
	4:"COMBINED"
};

//var allDestinations;
///* Load all permitted destinations for later use.*/
//function loadDestinationInfo() {
//    if (allDestinations === undefined) {
//        allDestinations = useOrderService().getUserDestinations();
//    }
//    var extraDestInfo = useOrderService().getUserDestinationInfo();
//    
//    for (destKey in allDestinations) {
//        var thisDest = allDestinations[destKey];
//        for (destInfoKey in extraDestInfo) {
//            var thisDestInfo = extraDestInfo[destInfoKey];
//            // Can be null if dest exists but has no configured markets.
//            if (thisDestInfo != null && thisDestInfo.destinationid == thisDest.id) {
//                thisDest.info = thisDestInfo;
//            }
//        }
//    }
//}
//
//// Gets basic destination stuff like names, etc.
//var allBaseDestinations;
//function getDestinationBasics() {
//    if (allBaseDestinations == undefined) {
//        allBaseDestinations = useOrderService().getAllDestinations()[1];
//    }
//    return allBaseDestinations;
//}
//
//var userTemplates;
//
//function savePositionAdjustment(posAdj){
//	useOrderService().addAdjustment({$entity : posAdj});
//}
//
//function getUserTemplates() {
//	if(userTemplates == undefined) {
//		userTemplates = useUserService().getUserTemplates();
//	}
//	return userTemplates;
//}
//
//function saveUserTemplates(templates) {
//	useUserService().saveUserTemplates({$entity : templates});
//}
//
//function deleteUserTemplates(templates) {
//	useUserService().deleteUserTemplates({$entity : templates});
//}
//
//// Gets destination configuration, e.g. markets.  Does not return description/gateway.
//function getAllDestinations() {
//    if (allDestinations == undefined) {
//        loadDestinationInfo();
//    }
//    return allDestinations;
//}
//
//function compareDestinations(a,b){
//	if (a.id < b.id)
//		return -1;
//	if (a.id > b.id)
//		return 1;
//	return 0;
//}
//
//function compareDepartments(a,b){
//	if (a.id < b.id)
//		return -1;
//	if (a.id > b.id)
//		return 1;
//	return 0;
//}
//
//function compareUsers(a,b){
//	if (a.id < b.id)
//		return -1;
//	if (a.id > b.id)
//		return 1;
//	return 0;
//}
//
//function getAdjustments(accountid) {
//    return useOrderService().getAdjustments({
//        'id' : accountid
//    });
//}
//
//var allUsers;
//
///* Load all permitted users by getting all visible users for visible departments.
// * Just tacks on users to the companies list, so this will give you companies, accounts, departments, users, and their permissions.
// * */
//function loadAllUserInfo() {
//    var companyList = getAllCompanies();
//    var allUsers = useUserService().getAllVisibleUsers()[1];
//    for (var i = 0; i < companyList.length; i++) {
//        var thisCompany = companyList[i];
//        var coUserInfo = new Array();
//        if (allUsers != null) {
//            for (var j = 0; j < allUsers.length; j++) {
//                var coUserEntry = {};
//                coUserEntry.user = allUsers[j].user;
//                if ((coUserEntry.user.companyId == thisCompany.id) && (coUserEntry.user.groupId == 0)) {
//                    coUserEntry.profile = allUsers[j].profile;
//                    coUserEntry.roles = allUsers[j].roles;
//                    coUserInfo.push(coUserEntry);
//                }
//            }        
//        }
//        thisCompany.users = coUserInfo;
//        for (var j = 0; j <thisCompany.departments.length; j++) {
//            var thisDept = thisCompany.departments[j];
//            thisDept.defaultRoles = getDefaultRoles(thisDept.id); // gotta remember what this does
//            thisDept.users = new Array();
//            if (allUsers != null) {
//                for (var k = 0; k < allUsers.length; k++) {
//                    var deptUserEntry = {};
//                    deptUserEntry.user = allUsers[k].user;
//                    if ((deptUserEntry.user.groupId == thisDept.id)) {
//                        deptUserEntry.profile = allUsers[j].profile;
//                        deptUserEntry.roles = allUsers[j].roles;
//                        deptUserEntry.permissions = allUsers[j].roles;
//                        thisDept.users.push(deptUserEntry);    
//                    }
//                }
//            }
//        }
//    }
//    return companyList;
//}
//
//var allRoles;
//
//function getAllRoles() {
//	if(allRoles == undefined) {
//		allRoles = useUserService().getAllRoles();
//	}
//	return allRoles;
//}
//
//function getDefaultRoles(deptid) {
//	return useUserService().getDefaultRoles({id: deptid});
//}
//
//function getAllUsers() {
//    if (allUsers == undefined) {
//        allUsers = loadAllUserInfo();
//    }
//    return allUsers;
//}
//
//var allCompanies;
///* Load all permitted companies and their departments/accounts
// * Gives you companies/accounts/departments. MAY contain user info if loadUserInfo() has been called since.
// * If you want user info in addition to this, use loadUserInfo() instead of this.
// * */
//function loadCompanyInfo() {
//    var allCompanies = useUserService().getAllLiveCompanies();
//    var allDepartments = useUserService().getAllVisibleDepartments();  
//    var allAccounts = useOrderService().findAccounts({$entity: {}});
//    for (var i = 0; i < allCompanies.length; i++) {
//        var thisCompany = allCompanies[i];
//        thisCompany.departments = new Array();
//        thisCompany.accounts = new Array();
//        for (var j = 0; j < allDepartments.length; j++) {
//            var thisDept = allDepartments[j];
//            if (thisDept.companyId == thisCompany.id) {
//                thisCompany.departments.push(thisDept);
//            }
//        }
//        //var allAccounts = useOrderService().getCompanyAccounts({'id':thisCompany.id}); // empty companyFilter
//        for (var k = 0; k < allAccounts.length; k++) {
//            var thisAcct = allAccounts[k];
//            if (thisAcct.companyId == thisCompany.id) {
//                thisCompany.accounts.push(thisAcct);
//            }
//        }
//    }
//    return allCompanies;
//}
//
//function getSystemStatus() {
//	return useOrderService().getSystemEvents();
//}
//
//function getAllCompanies() {
//    if (allCompanies == undefined) {
//        allCompanies = loadCompanyInfo();
//    }
//    return allCompanies;
//}
//
//function compareCompanies(a,b){
//	if (a.id < b.id)
//		return -1;
//	if (a.id > b.id)
//		return 1;
//	return 0;
//}
//
//function compareRoles(a,b){
//	if (a.id < b.id)
//		return -1;
//	if (a.id > b.id)
//		return 1;
//	return 0;
//}
//
//var primaryRole;
//var eventSource = {};
//function setEventSource() {
//    primaryRole = useOrderService().getPrimaryRole();
//
//    if (primaryRole == "administrator" || primaryRole == "companyadmin") {
//        eventSource.type = "COMPANY";
//    } else if (primaryRole == "admin") {
//        eventSource.type = "DEPARTMENT";
//    } else { // presumably "trader" role
//        eventSource.type = "USER";
//    }
//
//    useOrderService().setOrderEventSource(eventSource);
//}
//
//function getAccountMarkets(accountid) {
//	return useOrderService().getAccountMarkets({id : accountid});
//}
//
//function loadOrders(orderFilter) {
//    if (eventSource.type == "" ||  userInfo.userIDs == undefined) {
//        return;
//    }
//
//    if (orderFilter == null) {
//        if (eventSource.type == "USER") {
//            orderFilter = {
//                "userid" : userInfo.userIDs[0]
//            };
//        }
//        if (eventSource.type == "DEPARTMENT") {
//            orderFilter = {
//                "departmentid" : userInfo.userIDs[1]
//            };
//        }
//        if (eventSource.type == "COMPANY") {
//            orderFilter = {
//                "companyid" : userInfo.userIDs[2]
//            };
//        }    
//        orderFilter.showCalcs = true;
//    }
//
//    return useOrderService().findOrders({
//        $entity : orderFilter
//    });
//}
//
//var allAccounts;
//function getAllAccounts() {
//    if (allAccounts == undefined) {
//        allAccounts = useOrderService().getUserAccounts();
//    }
//    return allAccounts;
//}
//
//function getAccountPositions(accountid) {
//    return useOrderService().getAccountPositions({
//        "id":accountid
//    });
//}
//
//function getPositionAdjustments(accountid) {
//    return userOrderService().getAdjustments({
//        "id":accountid
//    });
//}
//

// make a summary of a set of positions. This will total all the positions for a given
// symbol, regardless of market id, present in the positions array.
function summarizePositions(positions) {
    var summaries = {};
    for(var positionKey in positions) {
        var position = positions[positionKey];
        var symbol = position.instrument.symbol;
        var exchange = position.instrument.exchangeid;
        var summary = summaries[symbol];
        if(typeof summary === 'undefined') {
            summary = {};
            summary.symbol = symbol;
            summary.exchange = exchange;
            summary.quantity = position.quantity;
            summary.price = position.price;
            summary.positions = [];
            summary.positions[0] = position;
        } else {
            var newsummary = sumPositions(summary, position);
            newsummary.positions = summary.positions;
            newsummary.positions.push(position);
            summary = newsummary;
        }
        summaries[symbol] = summary;
    }
    return summaries;
};

function sumPositions(p1,p2) {
    var summary = {};
    var newquantity = p1.quantity + p2.quantity;
    var newPrice = 0.0;
    if(newquantity !== 0) { // just return price/quantity of 0 if the 2 positions cancel out
        // If positions were opposite and the remaining quantity is from the other position, use the other price
        if(((p2.quantity > 0 && p1.quantity < 0) && (newquantity > 0)) || ((p2.quantity < 0 && p1.quantity > 0) && (newquantity < 0))) {
            newPrice = p2.price;
        // If positions were opposite and the remaining quantity is from this position, use this price
        } else if(((p2.quantity > 0 && p1.quantity < 0) && (newquantity < 0)) || ((p2.quantity < 0 && p1.quantity > 0) && (newquantity > 0))) {
            newPrice = p1.price;
        } else { // new price is average of two positions
            //			newPrice = this.price.multiply(new BigDecimal(this.quantity)).add((other.price.multiply(new BigDecimal(other.quantity))));
            //			newPrice = newPrice.divide(new BigDecimal(newquantity),priceDigits,RoundingMode.HALF_EVEN); // Guard against repeating decimals by scaling/rounding.
            newPrice = p1.price * p1.quantity + p2.price * p2.quantity;
            newPrice = newPrice / newquantity;
        }
    }
    summary.symbol = p1.symbol;
    summary.quantity = newquantity;
    summary.price = newPrice;
    return summary;
};

//module.exports = {
//    ordTypes: ordTypes,
//    summarizePositions: summarizePositions,
//    sumPositions: sumPositions
//};

//
//function placeOrder(side) {
//    var ordQty = $('input[name|="ordQty"]').val() * 1000;    
//    var ordSide = (side == 0) ? "BUY" : "SELL";
//
//    if (pageAccount == 0) {
//        $.publish("eventLog",["Can't place order - account unavailable."]);
//        return;
//    }
//    if (ordQty == 0) {
//        $.publish("eventLog",["Can't place order - 0 quantity."]);
//        return;
//    }
//
//    if (ordSide == undefined) {
//        $.publish("eventLog",["Can't place order - no side selected."]);
//        return;
//    }
//
//    $('input[name|="ordQty"]').val(0);
//
//    var stopPx = null;
//    var limitPx = null;
//    var ordTIF = $('select[name|="ordTIF"]').val();
//    var ordType = $('select[name|="ordType"]').val();
//    if (ordType == "LIMIT") {
//        limitPx = $('input[name|="ordLimitPrice"]').val();
//        if (limitPx == null || limitPx == 0 || limitPx == "0") {
//            $.publish("eventLog",["Can't place limit order - need price."]);
//            return;        
//        }
//    }
//    if (ordType == "STOP") {
//        stopPx = $('input[name|="ordStopPrice"]').val();
//        if (stopPx == null || stopPx == 0 || stopPx == "0") {
//            $.publish("eventLog",["Can't place stop order - need price."]);
//            return;        
//        }        
//    }
//
//    var ordInst = null;
//    var instVal = undefined;
//    if ($('select[name|="orderDS_SSInst"]').length > 0) {
//        instVal = $('select[name|="orderDS_SSInst"]').val();
//        if (instVal != undefined) {
//            ordInst = JSON.parse(instVal);
//        }
//    } else {
//        instVal = $('input[name|="orderDS_SSInst"]').val();
//        if (instVal != undefined) {
//            ordInst = JSON.parse(instVal);
//        }
//    }
//
//    if (ordInst == undefined || ordInst == null) {
//        $.publish("eventLog",["Can't place order - no instrument selected."]);
//        return;
//    }
//
//    var ordDest = null;
//    var destVal = undefined;
//    if ($('select[name|="orderDSID"]').length > 0) {
//        destVal = $('select[name|="orderDSID"]').val();
//        if (destVal != undefined) {
//            ordDest = JSON.parse(destVal);
//        }
//    } else {
//        destVal = $('input[name|="orderDSID"]').val();
//        if (destVal != undefined) {
//            ordDest = JSON.parse(destVal);
//        }
//    }
//
//    if (ordDest == undefined || ordDest == null) {
//        $.publish("eventLog",["Can't place order - no destination selected."]);
//        return;
//    }
//
//    var ordAcct = pageAccount;
//    /*
//        if ($('select[name|="orderDS_SSInst"]').length > 0) {
//            ordAcct = $('select[name|="orderUAID"]').val();
//        } else {
//            ordAcct = $('input[name|="orderUAID"]').val();
//        }*/
//    var order = {
//        "id" : null,
//        "state" : null,
//        "type" : ordType,
//        "offset" : 0.00000,
//        "side" : ordSide,
//        "groupId" : userInfo.userIDs[1],
//        "notes" : null,
//        "companyId" : userInfo.userIDs[2],
//        "ownerId" : userInfo.userIDs[0],
//        "creationTime" : (+new Date),
//        "quantity" : ordQty,
//        "instrument" : ordInst,
//        "relatedOrderId" : 0,
//        "accountId" : ordAcct,
//        "destinationId" : ordDest,
//        "expireTime" : 0,
//        "market" : ordInst.exchangeid,
//        "orderId" : null,
//        "price" : limitPx,
//        "ticketId" : null,
//        "tif" : ordTIF,
//        "dispQty" : 0,
//        "stopPrice" : stopPx,
//        "lastState" : null,
//        "capacity" : "AGENCY",
//        "cpOrderId" : null,
//        "avgprice" : null,
//        "cumqty" : 0,
//        "leavesqty" : 0,
//        "aon" : false,
//        "custOrderId" : createUUID(),
//        "execInst" : null,
//        "relatedClOrdId" : null,
//        "quoteId" : null
//    };
//
//    useOrderService().placeOrder({
//        $entity : order
//    });
//
//    $.publish("eventLog",["Order Sent: "+ordType+" "+ordSide+" "+ordQty+" "+ordInst.symbol+"."]);
//}
//
//// Poller which will subscribe to system status updates
//var statusPoller = {
//	    // true if we are actively polling
//	    started : false,
//
//	    subcount : 0,
//
//	    // number of failed requests
//	    failed : 0,
//
//	    // starting interval - 60 seconds
//	    interval : 60000,
//
//	    messages : [],
//
//	    // kicks off the setTimeout
//	    init : function() {
//	        if(this.started) {
//	            setTimeout($.proxy(this.getData, this),this.interval); // ensures 'this' is the poller obj inside getData, not the window object
//	        }
//	    },
//
//	    start : function() {
//	        if(!this.started) {
//	            this.started = true;
//	            this.init();
//	        }
//	    },
//
//	    stop : function() {
//	        this.started = false;
//	    },
//
//	    subscribe : function(handler) {
//	        var handle = $.subscribe("systemstatus",handler);
//	        if(!this.started) {
//	            this.start();
//	        }
//	        return handle;
//	    },
//
//	    unsubscribe : function(handle) {
//	        $.unsubscribe(handle)
//	        //NOTE: shouldn't there be some more logic here?
//            this.stop();
//	    },
//
//	    // get data
//	    getData : function() {
//	        var self = this;
//            self.messages = getSystemStatus();
//            $.publish("systemstatus",[self.messages]);
//	        // recurse on success
//	        self.init();
//	    }
//}
//
//// Poller which will subscribe to position updates.
//var positionPoller = {
//    // true if we are actively polling
//    started : false,
//
//    subcount : 0,
//
//    // number of failed requests
//    failed : 0,
//
//    // starting interval - 10 seconds
//    interval : 10000,
//
//    // holds positions for all accounts currently subscribed
//    positions : {},
//
//    // holds subscription counts for all account ids
//    subscriptions : {},
//
//    // kicks off the setTimeout
//    init : function() {
//        if(this.started) {
//            setTimeout($.proxy(this.getData, this),this.interval); // ensures 'this' is the poller obj inside getData, not the window object
//        }
//    },
//
//    start : function() {
//        if(!this.started) {
//            this.started = true;
//            this.init();
//        }
//    },
//
//    stop : function() {
//        this.started = false;
//    },
//
//    subscribe : function(accountid,handler) {
//        this.subcount++;
//        this.subscriptions[accountid] = this.subscriptions[accountid] == undefined ? 1 : ++this.subscriptions[accountid];
//        var handle = $.subscribe("/accounts/positions/"+accountid,handler);
//        if(!this.started) {
//            this.start();
//        }
//        return handle;
//    },
//
//    unsubscribe : function(accountid,handle) {
//        this.subcount--;
//        this.subscriptions[accountid]--;
//        $.unsubscribe(handle)
//        if(this.subcount == 0) {
//            this.stop();
//        }
//    },
//
//    // get data
//    getData : function() {
//        var self = this;
//        var subscriptionKey = 667;
//        for(subscriptionKey in self.subscriptions) {
//            var positions = getAccountPositions(subscriptionKey);
//            // do pub/sub of updated positions.
//            $.publish("/accounts/positions/"+subscriptionKey,[positions]);
//        }
//        // recurse on success
//        self.init();
//    }
//};

