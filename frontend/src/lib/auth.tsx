import {createContext, useContext, useState, useEffect, useCallback, type ReactNode} from 'react';
import {gql} from '@apollo/client';
import client from '../apollo-clients';

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      role
    }
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: {email: $email, password: $password}) {
      token
      user {
        id
        email
        role
      }
      errors
    }
  }
`;

const SIGNUP_MUTATION = gql`
  mutation Signup($email: String!, $password: String!, $firstName: String!, $lastName: String!, $clinicId: ID!) {
    signup(input: {email: $email, password: $password, firstName: $firstName, lastName: $lastName, clinicId: $clinicId}) {
      token
      user {
        id
        email
        role
      }
      errors
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
    }
  }
`;

type User = {
  id: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string[]>;
  signup: (email: string, password: string, firstName: string, lastName: string, clinicId: string) => Promise<string[]>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      client.query({query: ME_QUERY, fetchPolicy: 'network-only'})
        .then((result) => {
          if (result.data.me) {
            setUser(result.data.me);
          } else {
            setToken(null);
            localStorage.removeItem('authToken');
          }
        })
        .catch(() => {
          setToken(null);
          localStorage.removeItem('authToken');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await client.mutate({
      mutation: LOGIN_MUTATION,
      variables: {email, password},
    });
    const data = result.data?.login;
    if (data?.token) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('authToken', data.token);
      return [];
    }
    return data?.errors || ['Login failed'];
  }, []);

  const signup = useCallback(async (email: string, password: string, firstName: string, lastName: string, clinicId: string) => {
    const result = await client.mutate({
      mutation: SIGNUP_MUTATION,
      variables: {email, password, firstName, lastName, clinicId},
    });
    const data = result.data?.signup;
    if (data?.token) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('authToken', data.token);
      return [];
    }
    return data?.errors || ['Signup failed'];
  }, []);

  const logout = useCallback(async () => {
    try {
      await client.mutate({mutation: LOGOUT_MUTATION});
    } catch {
      // ignore server error on logout
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    await client.resetStore();
  }, []);

  return (
    <AuthContext.Provider value={{user, token, isAuthenticated: !!user, isLoading, login, signup, logout}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
