import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from 'react-apollo';
import client from './GraphqlEndpoint.jsx';
import TodoApp from './TodoApp.jsx';

ReactDOM.render(
  <ApolloProvider client={client}>
    <TodoApp />
  </ApolloProvider>,
  document.getElementById('root')
);