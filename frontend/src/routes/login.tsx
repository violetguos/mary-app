import {useState} from 'react';
import {createFileRoute, Link, useNavigate} from '@tanstack/react-router';
import {Box, TextField, Button, Typography, Paper, Alert} from '@mui/material';
import {useAuth} from '../lib/auth';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const {login, isAuthenticated} = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    navigate({to: '/dashboard'});
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);
    const errs = await login(email, password);
    setErrors(errs);
    if (errs.length === 0) navigate({to: '/dashboard'});
    setSubmitting(false);
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="grey.100">
      <Paper elevation={3} sx={{p: 4, width: 400}}>
        <Typography variant="h5" fontWeight={600} mb={3}>Sign in</Typography>
        {errors.map((e, i) => <Alert severity="error" key={i} sx={{mb: 1}}>{e}</Alert>)}
        <form onSubmit={handleSubmit}>
          <TextField label="Email" type="email" fullWidth required margin="normal" value={email} onChange={e => setEmail(e.target.value)} />
          <TextField label="Password" type="password" fullWidth required margin="normal" value={password} onChange={e => setPassword(e.target.value)} />
          <Button type="submit" variant="contained" fullWidth disabled={submitting} sx={{mt: 2, textTransform: 'none'}}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <Typography variant="body2" mt={2} textAlign="center">
          No account? <Link to="/signup">Sign up</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
