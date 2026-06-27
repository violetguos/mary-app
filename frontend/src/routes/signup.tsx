import {useState} from 'react';
import {createFileRoute, Link, useNavigate} from '@tanstack/react-router';
import {Box, TextField, Button, Typography, Paper, Alert} from '@mui/material';
import {useAuth} from '../lib/auth';

export const Route = createFileRoute('/signup')({
  component: SignupPage,
});

function SignupPage() {
  const {signup, isAuthenticated} = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
    const errs = await signup(email, password, firstName, lastName, '1');
    setErrors(errs);
    if (errs.length === 0) navigate({to: '/dashboard'});
    setSubmitting(false);
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="grey.100">
      <Paper elevation={3} sx={{p: 4, width: 400}}>
        <Typography variant="h5" fontWeight={600} mb={3}>Create account</Typography>
        {errors.map((e, i) => <Alert severity="error" key={i} sx={{mb: 1}}>{e}</Alert>)}
        <form onSubmit={handleSubmit}>
          <TextField label="First name" fullWidth required margin="normal" value={firstName} onChange={e => setFirstName(e.target.value)} />
          <TextField label="Last name" fullWidth required margin="normal" value={lastName} onChange={e => setLastName(e.target.value)} />
          <TextField label="Email" type="email" fullWidth required margin="normal" value={email} onChange={e => setEmail(e.target.value)} />
          <TextField label="Password" type="password" fullWidth required margin="normal" value={password} onChange={e => setPassword(e.target.value)} />
          <Button type="submit" variant="contained" fullWidth disabled={submitting} sx={{mt: 2, textTransform: 'none'}}>
            {submitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
        <Typography variant="body2" mt={2} textAlign="center">
          Already have one? <Link to="/login">Sign in</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
