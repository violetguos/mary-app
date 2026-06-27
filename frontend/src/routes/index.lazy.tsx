import {createLazyFileRoute, Navigate} from '@tanstack/react-router';
import {useAuth} from '../lib/auth';

export const Route = createLazyFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  const {isAuthenticated} = useAuth();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} />;
}
