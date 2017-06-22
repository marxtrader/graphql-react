// namespace

var restWrapper = function (data, method, uri) {
	switch (method) {
    case "GET" :
     console.log("GET / URI : ", uri);
     console.log("Data = ", data);
     break;
    case "POST" :
     console.log("PUT / URI (POST) : ", uri);
     console.log("Data = ", data);
     break;
    default :
	}; //end switch
	return data;
};

var REST = {
	apiURL : null,
    debug: false,
	loglevel : 0,
    antiBrowserCache : false,
    cacheHeaders : []
};

// helper function
REST.getKeys = function (o) {
    if (o !== Object(o))
        throw new TypeError('REST.getKeys called on non-object');
    var ret = [], p;
    for (p in o) 
        if (Object.prototype.hasOwnProperty.call(o, p)) 
            ret.push(p);
    return ret;
};

// constructor
REST.Request = function (){
	REST.log("Creating new Request");
	this.uri = null;
	this.method = "GET";
	this.username = null;
	this.password = null;
	this.acceptHeader = "*/*";
	this.contentTypeHeader = null;
	this.async = true;
	this.queryParameters = [];
	this.matrixParameters = [];
	this.formParameters = [];
  this.forms = [];
	this.cookies = [];
	this.headers = [];
	this.entity = null;
};

REST.Request.prototype = {
		execute : function(callback){
        var request = new XMLHttpRequest();
        var url = this.uri;

        if (REST.antiBrowserCache === true) {
            request.url = url;
        }
        
        for(var i=0;i<this.matrixParameters.length;i++){
    				url += ";" + REST.Encoding.encodePathParamName(this.matrixParameters[i][0]);
    				url += "=" + REST.Encoding.encodePathParamValue(this.matrixParameters[i][1]);
    		}
    		for(var i=0;i<this.queryParameters.length;i++){
				if(i === 0)
					url += "?";
				else
					url += "&";
				url += REST.Encoding.encodeQueryParamNameOrValue(this.queryParameters[i][0]);
				url += "=" + REST.Encoding.encodeQueryParamNameOrValue(this.queryParameters[i][1]);
			}
			for(var i=0;i<this.cookies.length;i++){
				document.cookie = escape(this.cookies[i][0]) 
					+ "=" + escape(this.cookies[i][1]);
			}
			request.open(this.method, url, this.async, this.username, this.password);
			var acceptSet = false;
			var contentTypeSet = false;
			for(var i=0;i<this.headers.length;i++){
				if(this.headers[i][0].toLowerCase() === 'accept')
					acceptSet = this.headers[i][1];
				if(this.headers[i][0].toLowerCase() === 'content-type')
					contentTypeSet = this.headers[i][1];
				request.setRequestHeader(REST.Encoding.encodeHeaderName(this.headers[i][0]),
						REST.Encoding.encodeHeaderValue(this.headers[i][1]));
			}
			if(!acceptSet)
				request.setRequestHeader('Accept', this.acceptHeader);
			REST.log("Got form params: "+this.formParameters.length);
			// see if we're sending an entity or a form
			if(this.entity && (this.formParameters.length > 0 || this.forms.length > 0))
				throw "Cannot have both an entity and form parameters";
			// form
			if(this.formParameters.length > 0 || this.forms.length > 0){
				if(contentTypeSet && contentTypeSet !== "application/x-www-form-urlencoded")
					throw "The ContentType that was set by header value ("+contentTypeSet+") is incompatible with form parameters";
				if(this.contentTypeHeader && this.contentTypeHeader !== "application/x-www-form-urlencoded")
					throw "The ContentType that was set with setContentType ("+this.contentTypeHeader+") is incompatible with form parameters";
				contentTypeSet = "application/x-www-form-urlencoded";
				request.setRequestHeader('Content-Type', contentTypeSet);
			}else if(this.entity && !contentTypeSet && this.contentTypeHeader){
				// entity
				contentTypeSet = this.contentTypeHeader;
				request.setRequestHeader('Content-Type', this.contentTypeHeader);
			}
			// we use this flag to work around buggy browsers
			var gotReadyStateChangeEvent = false;
			if(callback){
				request.onreadystatechange = function() {
					gotReadyStateChangeEvent = true;
					REST.log("Got readystatechange");
					REST._complete(this, callback);
				};
			}
			var data = this.entity;
			if(this.entity){
				if(this.entity instanceof Element){
					if(!contentTypeSet || REST._isXMLMIME(contentTypeSet))
						data = REST.serialiseXML(this.entity);
				}else if(this.entity instanceof Document){
					if(!contentTypeSet || REST._isXMLMIME(contentTypeSet))
						data = this.entity;
				}else if(this.entity instanceof Object){
					if(!contentTypeSet || REST._isJSONMIME(contentTypeSet))
						data = JSON.stringify(this.entity);
				}
			}else if(this.formParameters.length > 0){
				data = '';
				for(var i=0;i<this.formParameters.length;i++){
					if(i > 0)
						data += "&";
					data += REST.Encoding.encodeFormNameOrValue(this.formParameters[i][0]);
					data += "=" + REST.Encoding.encodeFormNameOrValue(this.formParameters[i][1]);
				}
            } else if (this.forms.length > 0) {
                data = '';
                for (var i = 0; i < this.forms.length; i++) {
                    if (i > 0)
                        data += "&";
                    var obj = this.forms[i][1];
                    var key = REST.getKeys(obj)[0];
                    data += REST.Encoding.encodeFormNameOrValue(key);
                    data += "=" + REST.Encoding.encodeFormNameOrValue(obj[key]);
                }
            }
			REST.log("Content-Type set to "+contentTypeSet);
			REST.log("Entity set to "+data);
			request.send(data);
			// now if the browser did not follow the specs and did not fire the events while synchronous,
			// handle it manually
			if(!this.async && !gotReadyStateChangeEvent && callback){
				REST.log("Working around browser readystatechange bug");
				REST._complete(request, callback);
			}

      if (REST.debug === true) {
        REST.lastRequest = request;
      }

      if (REST.antiBrowserCache === true && request.status !== 304) {
        var _cachedHeaders = {
            "Etag": request.getResponseHeader('Etag'),
            "Last-Modified": request.getResponseHeader('Last-Modified'),
            "entity": request.responseText
        };

      var signature = REST._generate_cache_signature(url);
      REST._remove_deprecated_cache_signature(signature);
      REST._addToArray(REST.cacheHeaders, signature, _cachedHeaders);
      }
    },
		setAccepts : function(acceptHeader){
			REST.log("setAccepts("+acceptHeader+")");
			this.acceptHeader = acceptHeader;
		},
		setCredentials : function(username, password){
			this.password = password;
			this.username = username;
		},
		setEntity : function(entity){
			REST.log("setEntity("+entity+")");
			this.entity = entity;
		},
		setContentType : function(contentType){
			REST.log("setContentType("+contentType+")");
			this.contentTypeHeader = contentType;
		},
		setURI : function(uri){
			REST.log("setURI("+uri+")");
			this.uri = uri;
		},
		setMethod : function(method){
			REST.log("setMethod("+method+")");
			this.method = method;
		},
		setAsync : function(async){
			REST.log("setAsync("+async+")");
			this.async = async;
		},
		addCookie : function(name, value){
			REST.log("addCookie("+name+"="+value+")");
      REST._addToArray(this.cookies, name, value);
		},
		addQueryParameter : function(name, value){
			REST.log("addQueryParameter("+name+"="+value+")");
      REST._addToArray(this.queryParameters, name, value);
		},
		addMatrixParameter : function(name, value){
			REST.log("addMatrixParameter("+name+"="+value+")");
      REST._addToArray(this.matrixParameters, name, value);
		},
		addFormParameter : function(name, value){
			REST.log("addFormParameter("+name+"="+value+")");
      REST._addToArray(this.formParameters, name, value);
		},
    addForm : function(name, value){
    		REST.log("addForm("+name+"="+value+")");
        REST._addToArray(this.forms, name, value);
    },
		addHeader : function(name, value){
			REST.log("addHeader("+name+"="+value+")");
      REST._addToArray(this.headers, name, value);
		}
};

REST.log = function (string) {
    if (REST.loglevel > 0)
        print(string);
};

REST._addToArray = function (array, name, value) {
    if (value instanceof Array) {
        for (var i = 0; i < value.length; i++) {
            array.push([name, value[i]]);
        }
    } else {
        array.push([name, value]);
    }
};

REST._generate_cache_signature = function (url) {
    return url.replace(/\?resteasy_jsapi_anti_cache=\d+/, '');
};

REST._remove_deprecated_cache_signature = function (signature) {
    for (var idx in REST.cacheHeaders) {
        var _signature = REST.cacheHeaders[idx][0];
        if (signature === _signature) {
            REST.cacheHeaders.splice(idx, 1);
        }
    }

};

REST._get_cache_signature = function (signature) {
    for (var idx in REST.cacheHeaders) {
        var _signature = REST.cacheHeaders[idx][0];
        if (signature === _signature) {
            return REST.cacheHeaders[idx];
        }
    }
    return null;
};

REST._complete = function(request, callback){
	REST.log("Request ready state: "+request.readyState);
	if(request.readyState === 4) {
		var entity;
		REST.log("Request status: "+request.status);
		REST.log("Request response: "+request.responseText);
		if(request.status >= 200 && request.status < 300){
			var contentType = request.getResponseHeader("Content-Type");
			if(contentType !== null){
				if(REST._isXMLMIME(contentType))
					entity = request.responseXML;
				else if(REST._isJSONMIME(contentType))
					entity = JSON.parse(request.responseText);
				else
					entity = request.responseText;
			}else
				entity = request.responseText;
		}

        if (request.status === 304) {
            entity = REST._get_cache_signature(REST._generate_cache_signature(request.url))[1]['entity'];
        }
        REST.log("Calling callback with: "+entity);
		callback(request.status, request, entity);
	}
};

REST._isXMLMIME = function(contentType){
	return contentType === "text/xml"
			|| contentType === "application/xml"
			|| (contentType.indexOf("application/") === 0
				&& contentType.lastIndexOf("+xml") === (contentType.length - 4));
};

REST._isJSONMIME = function(contentType){
	return contentType === "application/json"
			|| (contentType.indexOf("application/") === 0
				&& contentType.lastIndexOf("+json") === (contentType.length - 5));
};

/* Encoding */

REST.Encoding = {};

REST.Encoding.hash = function(a){
	var ret = {};
	for(var i=0;i<a.length;i++)
		ret[a[i]] = 1;
	return ret;
};

// rules

REST.Encoding.Alpha = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                       'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

REST.Encoding.Numeric = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

REST.Encoding.AlphaNum = [].concat(REST.Encoding.Alpha, REST.Encoding.Numeric); 

REST.Encoding.AlphaNumHash = REST.Encoding.hash(REST.Encoding.AlphaNum);

/**
 * unreserved = ALPHA / DIGIT / "-" / "." / "_" / "~"
 */
REST.Encoding.Unreserved = [].concat(REST.Encoding.AlphaNum, ['-', '.', '_', '~']);

/**
 * gen-delims = ":" / "/" / "?" / "#" / "[" / "]" / "@"
 */
REST.Encoding.GenDelims = [':', '/', '?', '#', '[', ']', '@'];

/**
 * sub-delims = "!" / "$" / "&" / "'" / "(" / ")" / "*" / "+" / "," / ";" / "="
 */
REST.Encoding.SubDelims = ['!','$','&','\'','(', ')', '*','+',',',';','='];

/**
 * reserved = gen-delims | sub-delims
 */
REST.Encoding.Reserved = [].concat(REST.Encoding.GenDelims, REST.Encoding.SubDelims);

/**
 * pchar = unreserved | escaped | sub-delims | ":" | "@"
 * 
 * Note: we don't allow escaped here since we will escape it ourselves, so we don't want to allow them in the
 * unescaped sequences
 */
REST.Encoding.PChar = [].concat(REST.Encoding.Unreserved, REST.Encoding.SubDelims, [':', '@']);

/**
 * path_segment = pchar <without> ";"
 */
REST.Encoding.PathSegmentHash = REST.Encoding.hash(REST.Encoding.PChar);
delete REST.Encoding.PathSegmentHash[";"];

/**
 * path_param_name = pchar <without> ";" | "="
 */
REST.Encoding.PathParamHash = REST.Encoding.hash(REST.Encoding.PChar);
delete REST.Encoding.PathParamHash[";"];
delete REST.Encoding.PathParamHash["="];

/**
 * path_param_value = pchar <without> ";"
 */
REST.Encoding.PathParamValueHash = REST.Encoding.hash(REST.Encoding.PChar);
delete REST.Encoding.PathParamValueHash[";"];

/**
 * query = pchar / "/" / "?"
 */
REST.Encoding.QueryHash = REST.Encoding.hash([].concat(REST.Encoding.PChar, ['/', '?']));
// deviate from the RFC to disallow separators such as "=", "@" and the famous "+" which is treated as a space
// when decoding
delete REST.Encoding.QueryHash["="];
delete REST.Encoding.QueryHash["&"];
delete REST.Encoding.QueryHash["+"];

/**
 * fragment = pchar / "/" / "?"
 */
REST.Encoding.FragmentHash = REST.Encoding.hash([].concat(REST.Encoding.PChar, ['/', '?']));

// HTTP

REST.Encoding.HTTPSeparators = ["(" , ")" , "<" , ">" , "@"
                                , "," , ";" , ":" , "\\" , "\""
                                , "/" , "[" , "]" , "?" , "="
                                , "{" , "}" , ' ' , '\t'];

// This should also hold the CTLs but we never need them
REST.Encoding.HTTPChar = [];
(function(){
	for(var i=32;i<127;i++)
		REST.Encoding.HTTPChar.push(String.fromCharCode(i));
})();

// CHAR - separators
REST.Encoding.HTTPToken = REST.Encoding.hash(REST.Encoding.HTTPChar);
(function(){
	for(var i=0;i<REST.Encoding.HTTPSeparators.length;i++)
		delete REST.Encoding.HTTPToken[REST.Encoding.HTTPSeparators[i]];
})();

//
// functions

//see http://www.w3.org/TR/html4/interact/forms.html#h-17.13.4.1
//and http://www.apps.ietf.org/rfc/rfc1738.html#page-4
REST.Encoding.encodeFormNameOrValue = function (val){
	return REST.Encoding.encodeValue(val, REST.Encoding.AlphaNumHash, true);
};


//see http://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2
REST.Encoding.encodeHeaderName = function (val){
	// token+ from http://www.w3.org/Protocols/rfc2616/rfc2616-sec2.html#sec2
	
	// There is no way to encode a header name. it is either a valid token or invalid and the 
	// XMLHttpRequest will fail (http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader-method)
	// What we could do here is throw if the value is invalid
	return val;
};

//see http://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2
REST.Encoding.encodeHeaderValue = function (val){
	// *TEXT or combinations of token, separators, and quoted-string from http://www.w3.org/Protocols/rfc2616/rfc2616-sec2.html#sec2
	// FIXME: implement me. Stef has given up, since it involves latin1, quoted strings, MIME encoding (http://www.ietf.org/rfc/rfc2047.txt)
	// which mentions a limit on encoded value of 75 chars, which should be split into several lines. This is mad.
	return val;
};

// see http://www.ietf.org/rfc/rfc3986.txt
REST.Encoding.encodeQueryParamNameOrValue = function (val){
	return REST.Encoding.encodeValue(val, REST.Encoding.QueryHash);
};

//see http://www.ietf.org/rfc/rfc3986.txt
REST.Encoding.encodePathSegment = function (val){
	return REST.Encoding.encodeValue(val, REST.Encoding.PathSegmentHash);
};

//see http://www.ietf.org/rfc/rfc3986.txt
REST.Encoding.encodePathParamName = function (val){
	return REST.Encoding.encodeValue(val, REST.Encoding.PathParamHash);
};

//see http://www.ietf.org/rfc/rfc3986.txt
REST.Encoding.encodePathParamValue = function (val){
	return REST.Encoding.encodeValue(val, REST.Encoding.PathParamValueHash);
};

REST.Encoding.encodeValue = function (val, allowed, form){
	if(typeof val !== "string"){
		REST.log("val is not a string");
		return val;
	}
	if(val.length === 0){
		REST.log("empty string");
		return val;
	}
	var ret = '';
	for(var i=0;i<val.length;i++){
		var first = val[i];
		if(allowed[first] === 1){
			REST.log("char allowed: "+first);
			ret = ret.concat(first);
		}else if(form && (first === ' ' || first === '\n')){
			// special rules for application/x-www-form-urlencoded
			if(first === ' ')
				ret += '+';
			else
				ret += '%0D%0A';
		}else{
			// See http://www.faqs.org/rfcs/rfc2781.html 2.2
			
			// switch to codepoint
			first = val.charCodeAt(i);
			// utf-16 pair?
			if(first < 0xD800 || first > 0xDFFF){
				// just a single utf-16 char
				ret = ret.concat(REST.Encoding.percentUTF8(first));
			}else{
				if(first > 0xDBFF || i+1 >= val.length)
					throw "Invalid UTF-16 value: " + val;
				var second = val.charCodeAt(++i);
				if(second < 0xDC00 || second > 0xDFFF)
					throw "Invalid UTF-16 value: " + val;
				// char = 10 lower bits of first shifted left + 10 lower bits of second 
				var c = ((first & 0x3FF) << 10) | (second & 0x3FF);
				// and add this
				c += 0x10000;
				// char is now 32 bit unicode
				ret = ret.concat(REST.Encoding.percentUTF8(c));
			}
		}
	}
	return ret;
};

// see http://tools.ietf.org/html/rfc3629
REST.Encoding.percentUTF8 = function(c){
	if(c < 0x80)
		return REST.Encoding.percentByte(c);
	if(c < 0x800){
		var first = 0xC0 | ((c & 0x7C0) >> 6);
		var second = 0x80 | (c & 0x3F);
		return REST.Encoding.percentByte(first, second);
	}
	if(c < 0x10000){
		var first = 0xE0 | ((c >> 12) & 0xF);
		var second = 0x80 | ((c >> 6) & 0x3F);
		var third = 0x80 | (c & 0x3F);
		return REST.Encoding.percentByte(first, second, third);
	}
	if(c < 0x110000){
		var first = 0xF0 | ((c >> 18) & 0x7);
		var second = 0x80 | ((c >> 12) & 0x3F);
		var third = 0x80 | ((c >> 6) & 0x3F);
		var fourth = 0x80 | (c & 0x3F);
		return REST.Encoding.percentByte(first, second, third, fourth);
	}
	throw "Invalid character for UTF-8: "+c;
};

REST.Encoding.percentByte = function(){
	var ret = '';
	for(var i=0;i<arguments.length;i++){
		var b = arguments[i];
		if (b >= 0 && b <= 15)
			ret += "%0" + b.toString(16);
		else
			ret += "%" + b.toString(16);
	}
	return ret;
};

REST.serialiseXML = function(node){
	if (typeof XMLSerializer !== "undefined")
		return (new XMLSerializer()).serializeToString(node) ;
	else if (node.xml) return node.xml;
	else throw "XML.serialize is not supported or can't serialize " + node;
};
REST.apiURL = 'http://localhost:8080/omsrestservices';
var IOMSOrderManagementRESTServices = {};

// GET /rest/accounts/{id}/positions
IOMSOrderManagementRESTServices.getAccountPositions = function (_params) {
    var params = _params ? _params : {};
    var request = new REST.Request();
    request.setMethod('GET');
    var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
    uri += '/rest/accounts/';
    uri += REST.Encoding.encodePathSegment(params.id);
    uri += '/positions';
    request.setURI(uri);
    if (params.$username && params.$password)
        request.setCredentials(params.$username, params.$password);
    if (params.$accepts)
        request.setAccepts(params.$accepts);
    else
        request.setAccepts('application/json');
    if (REST.antiBrowserCache === true) {
        request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
        var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
        if (cached_obj !== null) {
            request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']);
            request.addHeader('If-None-Match', cached_obj[1]['Etag']);
        }
    }
    if (params.$contentType)
        request.setContentType(params.$contentType);
    else
        request.setContentType('text/plain');
    if (params.$callback) {
        request.execute(params.$callback);
    } else {
        var returnValue;
        request.setAsync(false);
        var callback = function (httpCode, xmlHttpRequest, value) {
            returnValue = value;
        };
        request.execute(callback);
        return restWrapper(returnValue, request.method, uri);
    }
};

// GET /rest/companies/{id}/accounts
IOMSOrderManagementRESTServices.getCompanyAccounts = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/companies/';
 uri += REST.Encoding.encodePathSegment(params.id);
 uri += '/accounts';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/destinations/info/company/{id}
IOMSOrderManagementRESTServices.getCompanyDestinationInfo = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/destinations/info/company/';
 uri += REST.Encoding.encodePathSegment(params.id);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/destinations/info
IOMSOrderManagementRESTServices.getAllDestinationInfo = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/destinations/info';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/destinations/info/{id}
IOMSOrderManagementRESTServices.getDestinationInfo = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/destinations/info/';
 uri += REST.Encoding.encodePathSegment(params.id);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/destinations/info/user
IOMSOrderManagementRESTServices.getUserDestinationInfo = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/destinations/info/user';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/roles/primary
IOMSOrderManagementRESTServices.getPrimaryRole = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/roles/primary';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('text/plain');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/orders/place
IOMSOrderManagementRESTServices.placeOrder = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/orders/place';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/orders/placeTrigger
IOMSOrderManagementRESTServices.placeTriggerOrder = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/orders/placeTrigger';
 if(params.$entity)
  request.setEntity(params.$entity);
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/orders/{id}/replace
IOMSOrderManagementRESTServices.replaceOrder = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/orders/';
 uri += REST.Encoding.encodePathSegment(params.id);
 uri += '/replace';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/findOrders
IOMSOrderManagementRESTServices.findOrders = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/findOrders';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/accounts/{id}/retireTickets
IOMSOrderManagementRESTServices.retireAccountTickets = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/accounts/';
 uri += REST.Encoding.encodePathSegment(params.id);
 uri += '/retireTickets';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/accounts/{id}/deleteadjustments
IOMSOrderManagementRESTServices.deleteAdjustments = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/accounts/';
 uri += REST.Encoding.encodePathSegment(params.id);
 uri += '/deleteadjustments';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/accounts/new
IOMSOrderManagementRESTServices.saveAccount = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/accounts/new';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('text/plain');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/gateways/usergatewaycredentials
IOMSOrderManagementRESTServices.setUserGatewayCredentials = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/gateways/usergatewaycredentials';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/gateways/{userid}/usergatewaycredentials
IOMSOrderManagementRESTServices.getUserGatewayCredentials = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/gateways/';
 uri += REST.Encoding.encodePathSegment(params.userid);
 uri += '/usergatewaycredentials';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/accounts/{id}/adjustments
IOMSOrderManagementRESTServices.getAdjustments = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/accounts/';
 uri += REST.Encoding.encodePathSegment(params.id);
 uri += '/adjustments';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/accounts/adjustments/new
IOMSOrderManagementRESTServices.addAdjustment = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/accounts/adjustments/new';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/destinations/{id}
IOMSOrderManagementRESTServices.getDestination = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/destinations/';
 uri += REST.Encoding.encodePathSegment(params.id);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/greylabels
IOMSOrderManagementRESTServices.getGreyLabel = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/greylabels';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/greylabels/all
IOMSOrderManagementRESTServices.getAllGreyLabels = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/greylabels/all';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/greylabels/delete
IOMSOrderManagementRESTServices.deleteGreyLabel = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/greylabels/delete';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/greylabels/users/accounts/update
IOMSOrderManagementRESTServices.saveMT4User = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/greylabels/users/accounts/update';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/greylabels/save
IOMSOrderManagementRESTServices.saveGreyLabel = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/greylabels/save';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/greylabels/dashboard
IOMSOrderManagementRESTServices.getDashboardInfo = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/greylabels/dashboard';
 if(Object.prototype.hasOwnProperty.call(params, 'greyLabelId'))
  request.addQueryParameter('greyLabelId', params.greyLabelId);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/greylabels/accounts/{accountID}/equity
IOMSOrderManagementRESTServices.getAccountEquity = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/greylabels/accounts/';
 uri += REST.Encoding.encodePathSegment(params.accountID);
 uri += '/equity';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/greylabels/accounts/{accountID}/freeMargin
IOMSOrderManagementRESTServices.getAccountFreeMargin = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/greylabels/accounts/';
 uri += REST.Encoding.encodePathSegment(params.accountID);
 uri += '/freeMargin';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/greylabels/accounts/{accountID}/requiredMargin
IOMSOrderManagementRESTServices.getAccountRequiredMargin = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/greylabels/accounts/';
 uri += REST.Encoding.encodePathSegment(params.accountID);
 uri += '/requiredMargin';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/greylabels/accounts/{accountID}/buyingPower
IOMSOrderManagementRESTServices.getAccountBuyingPower = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/greylabels/accounts/';
 uri += REST.Encoding.encodePathSegment(params.accountID);
 uri += '/buyingPower';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/greylabels/accounts/{accountID}/balance
IOMSOrderManagementRESTServices.getAccountBalance = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/greylabels/accounts/';
 uri += REST.Encoding.encodePathSegment(params.accountID);
 uri += '/balance';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/orders/{id}
IOMSOrderManagementRESTServices.getOrder = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/orders/';
 uri += REST.Encoding.encodePathSegment(params.id);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/accounts/{id}
IOMSOrderManagementRESTServices.getAccount = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/accounts/';
 uri += REST.Encoding.encodePathSegment(params.id);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/mergedmarketrouter/{modulename}
IOMSOrderManagementRESTServices.getSettings = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/mergedmarketrouter/';
 uri += REST.Encoding.encodePathSegment(params.modulename);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/mergedmarketrouter/{modulename}
IOMSOrderManagementRESTServices.setSettings = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/mergedmarketrouter/';
 uri += REST.Encoding.encodePathSegment(params.modulename);
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/delayedbbookgenerator/groupholdtimes
IOMSOrderManagementRESTServices.setDelayedBBookGeneratorGroupHoldTimes = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/delayedbbookgenerator/groupholdtimes';
 if(params.$entity)
  request.setEntity(params.$entity);
 if(Object.prototype.hasOwnProperty.call(params, 'modulename'))
  request.addQueryParameter('modulename', params.modulename);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/orders/{id}/cancel
IOMSOrderManagementRESTServices.cancelOrder = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/orders/';
 uri += REST.Encoding.encodePathSegment(params.id);
 uri += '/cancel';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/orders/dock
IOMSOrderManagementRESTServices.dockOrder = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/orders/dock';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/orders/{id}/undock
IOMSOrderManagementRESTServices.undockOrder = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/orders/';
 uri += REST.Encoding.encodePathSegment(params.id);
 uri += '/undock';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/orders/active
IOMSOrderManagementRESTServices.getUserActiveOrders = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/orders/active';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/orders/{id}/executions
IOMSOrderManagementRESTServices.getOrderExecutions = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/orders/';
 uri += REST.Encoding.encodePathSegment(params.id);
 uri += '/executions';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/orders/eventsource/{type}
IOMSOrderManagementRESTServices.setOrderEventSource = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/orders/eventsource/';
 uri += REST.Encoding.encodePathSegment(params.type);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('text/plain');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/orders/events
IOMSOrderManagementRESTServices.getOrderEvents = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/orders/events';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/orders/{id}/calculations
IOMSOrderManagementRESTServices.getOrderCalculations = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/orders/';
 uri += REST.Encoding.encodePathSegment(params.id);
 uri += '/calculations';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/userDestinations
IOMSOrderManagementRESTServices.getUserDestinations = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/userDestinations';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/findAccounts
IOMSOrderManagementRESTServices.findAccounts = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/findAccounts';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/accounts
IOMSOrderManagementRESTServices.getUserAccounts = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/accounts';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/delayedbbookgenerator/defaultholdtime
IOMSOrderManagementRESTServices.setDelayedBBookGeneratorDefaultHoldTime = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/delayedbbookgenerator/defaultholdtime';
 if(params.$entity)
  request.setEntity(params.$entity);
 if(Object.prototype.hasOwnProperty.call(params, 'modulename'))
  request.addQueryParameter('modulename', params.modulename);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/delayedbbookgenerator/{modulename}/defaultholdtime
IOMSOrderManagementRESTServices.getDelayedBBookGeneratorDefaultHoldTime = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/delayedbbookgenerator/';
 uri += REST.Encoding.encodePathSegment(params.modulename);
 uri += '/defaultholdtime';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('text/plain');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/systemevents/all
IOMSOrderManagementRESTServices.getSystemEvents = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/systemevents/all';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/delayedbbookgenerator/{modulename}/destholdtimes
IOMSOrderManagementRESTServices.getDelayedBBookGeneratorDestinationHoldTimes = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/delayedbbookgenerator/';
 uri += REST.Encoding.encodePathSegment(params.modulename);
 uri += '/destholdtimes';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/delayedbbookgenerator/destholdtimes
IOMSOrderManagementRESTServices.setDelayedBBookGeneratorDestinationHoldTimes = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/delayedbbookgenerator/destholdtimes';
 if(params.$entity)
  request.setEntity(params.$entity);
 if(Object.prototype.hasOwnProperty.call(params, 'modulename'))
  request.addQueryParameter('modulename', params.modulename);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/delayedbbookgenerator/{modulename}/groupDestMap
IOMSOrderManagementRESTServices.getDelayedBBookGeneratorGroupDestinationMap = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/delayedbbookgenerator/';
 uri += REST.Encoding.encodePathSegment(params.modulename);
 uri += '/groupDestMap';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/delayedbbookgenerator/groupDestMap
IOMSOrderManagementRESTServices.setDelayedBBookGeneratorGroupDestinationMap = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/delayedbbookgenerator/groupDestMap';
 if(params.$entity)
  request.setEntity(params.$entity);
 if(Object.prototype.hasOwnProperty.call(params, 'modulename'))
  request.addQueryParameter('modulename', params.modulename);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/marketdata/send/{modulename}
IOMSOrderManagementRESTServices.sendTick = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/marketdata/send/';
 uri += REST.Encoding.encodePathSegment(params.modulename);
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
 return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/destinations/info/save
IOMSOrderManagementRESTServices.saveDestinationInfo = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/destinations/info/save';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/destinations/save
IOMSOrderManagementRESTServices.saveDestination = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/destinations/save';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/accounts/{id}/markets
IOMSOrderManagementRESTServices.getAccountMarkets = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/accounts/';
 uri += REST.Encoding.encodePathSegment(params.id);
 uri += '/markets';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/accounts/{id}/delete
IOMSOrderManagementRESTServices.deleteAccount = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/accounts/';
 uri += REST.Encoding.encodePathSegment(params.id);
 uri += '/delete';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/meta/instruments/types
IOMSOrderManagementRESTServices.getInstrumentTypes = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/meta/instruments/types';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/delayedbbookgenerator/{modulename}/groupholdtimes
IOMSOrderManagementRESTServices.getDelayedBBookGeneratorGroupHoldTimes = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/delayedbbookgenerator/';
 uri += REST.Encoding.encodePathSegment(params.modulename);
 uri += '/groupholdtimes';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/sequences/delete
IOMSOrderManagementRESTServices.deleteSequenceSource = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/sequences/delete';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/destinations/all
IOMSOrderManagementRESTServices.getAllDestinations = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/destinations/all';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/destinations/markets/all
IOMSOrderManagementRESTServices.getAllDestinationMarkets = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/destinations/markets/all';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/userids
IOMSOrderManagementRESTServices.getUserIDs = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/userids';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/orders/replace
IOMSOrderManagementRESTServices.replaceOrder2 = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/orders/replace';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/orders/cancel
IOMSOrderManagementRESTServices.cancelOrder2 = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/orders/cancel';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/orders/events2
IOMSOrderManagementRESTServices.getOrderEvents2 = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/orders/events2';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/sequences/allocations/{sourceID}/list
IOMSOrderManagementRESTServices.getSequenceAllocationList = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/sequences/allocations/';
 uri += REST.Encoding.encodePathSegment(params.sourceID);
 uri += '/list';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/meta/enums
IOMSOrderManagementRESTServices.getEnums = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/meta/enums';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/meta/orders/types
IOMSOrderManagementRESTServices.getOrderTypes = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/meta/orders/types';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/meta/orders/states
IOMSOrderManagementRESTServices.getOrderStates = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/meta/orders/states';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/meta/orders/tifs
IOMSOrderManagementRESTServices.getOrderTIFs = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/meta/orders/tifs';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/meta/orders/sides
IOMSOrderManagementRESTServices.getOrderSides = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/meta/orders/sides';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/meta/executions/types
IOMSOrderManagementRESTServices.getExecutionTypes = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/meta/executions/types';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/meta/executions/instructions
IOMSOrderManagementRESTServices.getExecutionInstructions = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/meta/executions/instructions';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/meta/accounts/types
IOMSOrderManagementRESTServices.getAccountTypes = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/meta/accounts/types';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/meta/tickets/states
IOMSOrderManagementRESTServices.getTicketStates = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/meta/tickets/states';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/sequences/all
IOMSOrderManagementRESTServices.getAllSequenceSources = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/sequences/all';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/sequences/save
IOMSOrderManagementRESTServices.saveSequenceSource = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/sequences/save';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/sequences/allocations/{sourceID}/clear
IOMSOrderManagementRESTServices.clearSequenceSource = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/sequences/allocations/';
 uri += REST.Encoding.encodePathSegment(params.sourceID);
 uri += '/clear';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/sequences/allocations/{sourceID}/new/{allocSize}
IOMSOrderManagementRESTServices.addSequenceAllocation = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/sequences/allocations/';
 uri += REST.Encoding.encodePathSegment(params.sourceID);
 uri += '/new/';
 uri += REST.Encoding.encodePathSegment(params.allocSize);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/earproperties
IOMSOrderManagementRESTServices.getEarProperty = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/earproperties';
 if(Object.prototype.hasOwnProperty.call(params, 'propname'))
  request.addQueryParameter('propname', params.propname);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('text/plain');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// POST /rest/greylabels/bookset
IOMSOrderManagementRESTServices.getGreyLabelBookSet = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('POST');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/greylabels/bookset';
 if(params.$entity)
  request.setEntity(params.$entity);
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('application/json');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('application/json');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
// GET /rest/orders/eventsource/{type}/history
IOMSOrderManagementRESTServices.setOrderEventSourceWithHistory = function(_params){
 var params = _params ? _params : {};
 var request = new REST.Request();
 request.setMethod('GET');
 var uri = params.$apiURL ? params.$apiURL : REST.apiURL;
 uri += '/rest/orders/eventsource/';
 uri += REST.Encoding.encodePathSegment(params.type);
 uri += '/history';
 request.setURI(uri);
 if(params.$username && params.$password)
  request.setCredentials(params.$username, params.$password);
 if(params.$accepts)
  request.setAccepts(params.$accepts);
 else
  request.setAccepts('text/plain');
if (REST.antiBrowserCache == true) {
  request.addQueryParameter('resteasy_jsapi_anti_cache', (new Date().getTime()));
    var cached_obj = REST._get_cache_signature(REST._generate_cache_signature(uri));
    if (cached_obj != null) { request.addHeader('If-Modified-Since', cached_obj[1]['Last-Modified']); request.addHeader('If-None-Match', cached_obj[1]['Etag']);}
}
 if(params.$contentType)
  request.setContentType(params.$contentType);
 else
  request.setContentType('text/plain');
 if(params.$callback){
  request.execute(params.$callback);
 }else{
  var returnValue;
  request.setAsync(false);
  var callback = function(httpCode, xmlHttpRequest, value){ returnValue = value;};
  request.execute(callback);
  return restWrapper(returnValue,request.method,uri);
 }
};
