import { ApolloClient, createNetworkInterface } from 'react-apollo';
const config = require('../../assets/js/services/tradingServer/config.js');

const localServiceUrl = 'http://localhost:8080/graphqlserver/rest/graphql/root';
const remoteServiceUrl = config.serverUrl + 'graphqlserver/rest/graphql/root';
let serviceUrl;
if ((process.env.NODE_ENV === 'testing') || (process.env.NODE_ENV === 'minimize')) {
    serviceUrl = remoteServiceUrl;
}else{
    serviceUrl = localServiceUrl;
}

const client = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri: serviceUrl
  })
});

export default client;