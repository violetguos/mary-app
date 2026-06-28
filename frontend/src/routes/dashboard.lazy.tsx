import {createLazyFileRoute, useNavigate} from '@tanstack/react-router';
import {gql} from '@apollo/client';
import {useQuery} from '@apollo/client/react';
import {Box, Typography, Card, CardContent, Chip, Button, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper as MuiPaper} from '@mui/material';
import {useAuth} from '../lib/auth';

export const Route = createLazyFileRoute('/dashboard')({
  component: DashboardPage,
});

const CLINICS_QUERY = gql`
  query Clinics {
    clinics {
      id
      name
      subdomain
      address
      phone
      services {
        id
        name
        durationMinutes
        priceCents
        category
      }
    }
  }
`;

function DashboardPage() {
  const {user, logout} = useAuth();
  const navigate = useNavigate();
  const {loading, error, data} = useQuery(CLINICS_QUERY);

  const handleLogout = async () => {
    await logout();
    navigate({to: '/login'});
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">Failed to load data: {error.message}</Alert>;

  const clinic = data?.clinics?.[0];

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <Box maxWidth={900} mx="auto" mt={4} px={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={600}>{clinic?.name || 'Dashboard'}</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
          <Button variant="contained" size="small" onClick={() => navigate({to: '/book'})} sx={{textTransform: 'none'}}>Book appointment</Button>
          <Button variant="outlined" size="small" onClick={handleLogout} sx={{textTransform: 'none'}}>Sign out</Button>
        </Box>
      </Box>

      {clinic && (
        <Card sx={{mb: 3}}>
          <CardContent>
            <Typography variant="body1">{clinic.address}</Typography>
            <Typography variant="body1">{clinic.phone}</Typography>
          </CardContent>
        </Card>
      )}

      <Typography variant="h5" fontWeight={600} mb={2}>Services</Typography>
      <TableContainer component={MuiPaper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Service</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Category</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.clinics?.[0]?.services?.map((svc: any) => (
              <TableRow key={svc.id}>
                <TableCell>{svc.name}</TableCell>
                <TableCell>{svc.durationMinutes} min</TableCell>
                <TableCell>{formatPrice(svc.priceCents)}</TableCell>
                <TableCell><Chip label={svc.category} size="small" variant="outlined" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
