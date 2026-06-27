import {ApolloClient, InMemoryCache, createHttpLink, from} from '@apollo/client';
import {setContext} from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://127.0.0.1:8090/graphql',
});

const authLink = setContext((_, {headers}) => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      ...headers,
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
  };
});

const client = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;
