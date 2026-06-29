import {useState, ReactNode} from 'react';
import {createLazyFileRoute, useNavigate} from '@tanstack/react-router';
import {gql} from '@apollo/client';
import {useQuery, useMutation} from '@apollo/client/react';
import {
  Box, Typography, Card, CardContent, Chip, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper as MuiPaper, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, TextField, Snackbar,
} from '@mui/material';
import {useAuth} from '../lib/auth';

export const Route = createLazyFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPanel({children}: {children: ReactNode}) {
  return (
    <Box sx={{width: '100%', maxWidth: 980, p: {xs: 2, md: 4}, bgcolor: 'white', borderRadius: 3, boxShadow: '0 12px 30px rgba(0,0,0,0.08)'}}>
      {children}
    </Box>
  );
}

const CLINICS_QUERY = gql`
  query Clinics {
    clinics {
      id
      name
      subdomain
      address
      phone
      cancellationWindowHours
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

const MY_APPOINTMENTS_QUERY = gql`
  query MyAppointments {
    myAppointments {
      id
      startsAt
      endsAt
      status
      cancellationReason
      cancelledAt
      service { id name durationMinutes }
      staff { email }
      clinic { id name cancellationWindowHours }
    }
  }
`;

const CANCEL_MUTATION = gql`
  mutation CancelAppointment($appointmentId: ID!, $reason: String) {
    cancelAppointment(input: {appointmentId: $appointmentId, reason: $reason}) {
      appointment { id status cancelledAt cancellationReason }
      errors
    }
  }
`;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
}

function canCancel(appointment: any): {allowed: boolean; message: string} {
  if (appointment.status !== 'scheduled' && appointment.status !== 'confirmed') {
    return {allowed: false, message: `Status: ${appointment.status}`};
  }
  const windowHours = appointment.clinic?.cancellationWindowHours ?? 24;
  if (windowHours <= 0) return {allowed: true, message: ''};
  const deadline = new Date(appointment.startsAt).getTime() - windowHours * 3600000;
  if (Date.now() >= deadline) {
    return {allowed: false, message: `Cancellation window closed (must cancel ${windowHours}h before)`};
  }
  return {allowed: true, message: ''};
}

function DashboardHeader({clinic, user, onBook, onLogout}: {clinic: any; user: any; onBook: () => void; onLogout: () => void}) {
  return (
    <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2}}>
      <Box>
        <Typography variant="h4" sx={{fontWeight: 700}}>{clinic?.name || 'Dashboard'}</Typography>
        {clinic && (
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            {clinic.address} · {clinic.phone}
          </Typography>
        )}
      </Box>
      <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
        <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
        <Button variant="contained" onClick={onBook} sx={{textTransform: 'none', px: 2.5}}>
          Book appointment
        </Button>
        <Button variant="outlined" color="inherit" onClick={onLogout} sx={{textTransform: 'none'}}>
          Sign out
        </Button>
      </Box>
    </Box>
  );
}

function AppointmentCard({appointment, onCancel}: {appointment: any; onCancel: (a: any) => void}) {
  const check = canCancel(appointment);
  return (
    <Card variant="outlined" sx={{mb: 1.5}}>
      <CardContent sx={{p: 2.5, '&:last-child': {pb: 2.5}}}>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Box sx={{flex: 1, minWidth: 0}}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 0.5}}>
              <Typography variant="subtitle1" sx={{fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                {appointment.service.name}
              </Typography>
              <Chip
                label={appointment.status}
                size="small"
                color={appointment.status === 'scheduled' ? 'primary' : 'success'}
                sx={{textTransform: 'capitalize', fontWeight: 500, fontSize: 11, flexShrink: 0}}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {formatDate(appointment.startsAt)} at {formatTime(appointment.startsAt)} · {appointment.service.durationMinutes} min
            </Typography>
            <Typography variant="body2" color="text.secondary">
              with {appointment.staff?.email?.split('@')[0] || 'Practitioner'}
            </Typography>
          </Box>
          <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, ml: 2}}>
            <Button
              variant={check.allowed ? 'outlined' : 'text'}
              color="error"
              size="small"
              disabled={!check.allowed}
              onClick={() => onCancel(appointment)}
              sx={{textTransform: 'none', minWidth: 90}}
            >
              {check.allowed ? 'Cancel' : 'Locked'}
            </Button>
            {!check.allowed && check.message && (
              <Typography variant="caption" color="text.disabled" mt={0.5} textAlign="right" sx={{maxWidth: 180}}>
                {check.message}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function CancelDialog({appointment, reason, onReasonChange, onConfirm, onClose, loading}: {
  appointment: any; reason: string; onReasonChange: (r: string) => void;
  onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  return (
    <Dialog open={!!appointment} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cancel appointment?</DialogTitle>
      <DialogContent>
        {appointment && (
          <>
            <DialogContentText mb={2}>
              This will cancel your <strong>{appointment.service?.name}</strong> on {formatDate(appointment.startsAt)} at {formatTime(appointment.startsAt)}.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Reason (optional)"
              fullWidth
              variant="outlined"
              value={reason}
              onChange={e => onReasonChange(e.target.value)}
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{px: 3, pb: 2}}>
        <Button onClick={onClose} sx={{textTransform: 'none'}}>Keep</Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading} sx={{textTransform: 'none'}}>
          {loading ? 'Cancelling...' : 'Confirm cancel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ServicesTable({services}: {services: any[]}) {
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  return (
    <TableContainer component={MuiPaper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{fontWeight: 600}}>Service</TableCell>
            <TableCell sx={{fontWeight: 600}}>Duration</TableCell>
            <TableCell sx={{fontWeight: 600}}>Price</TableCell>
            <TableCell sx={{fontWeight: 600}}>Category</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {services.map((svc: any) => (
            <TableRow key={svc.id} sx={{'&:last-child td': {borderBottom: 0}}}>
              <TableCell>{svc.name}</TableCell>
              <TableCell>{svc.durationMinutes} min</TableCell>
              <TableCell>{formatPrice(svc.priceCents)}</TableCell>
              <TableCell>
                <Chip label={svc.category} size="small" variant="outlined" sx={{textTransform: 'capitalize'}} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function DashboardPage() {
  const {user, logout} = useAuth();
  const navigate = useNavigate();
  const {loading, error, data} = useQuery(CLINICS_QUERY);
  const {loading: loadingAppts, data: apptData} = useQuery(MY_APPOINTMENTS_QUERY);

  const [cancelAppointment, {loading: cancelling}] = useMutation(CANCEL_MUTATION, {
    refetchQueries: [{query: MY_APPOINTMENTS_QUERY}],
  });

  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [snackbar, setSnackbar] = useState<string | null>(null);

  if (loading || loadingAppts) {
    return (
      <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f5f5f5'}}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f5f5f5'}}>
        <Alert severity="error">Failed to load data: {error.message}</Alert>
      </Box>
    );
  }

  const clinic = data?.clinics?.[0];
  const appointments = apptData?.myAppointments || [];
  const upcomingAppts = appointments.filter((a: any) =>
    ['scheduled', 'confirmed'].includes(a.status) && new Date(a.startsAt) > new Date()
  );

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      const {data} = await cancelAppointment({
        variables: {appointmentId: cancelTarget.id, reason: cancelReason || null},
      });
      const errs = data?.cancelAppointment?.errors;
      if (errs?.length) {
        setSnackbar(errs.join(', '));
      } else {
        setSnackbar('Appointment cancelled');
        setCancelTarget(null);
        setCancelReason('');
      }
    } catch (e: any) {
      setSnackbar(e.message);
    }
  };

  return (
    <>
      <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', bgcolor: '#f5f5f5', p: {xs: 2, md: 3}}}>
        <DashboardPanel>
          <DashboardHeader
            clinic={clinic}
            user={user}
            onBook={() => navigate({to: '/book'})}
            onLogout={async () => { await logout(); navigate({to: '/login'}); }}
          />

          {/* Upcoming appointments */}
          <Box mb={4}>
            <Typography variant="h5" sx={{fontWeight: 600, mb: 2}}>Upcoming Appointments</Typography>
            {upcomingAppts.length === 0 ? (
              <Card variant="outlined" sx={{bgcolor: 'transparent'}}>
                <CardContent sx={{p: 3, textAlign: 'center'}}>
                  <Typography variant="body2" color="text.secondary">No upcoming appointments</Typography>
                  <Button variant="text" onClick={() => navigate({to: '/book'})} sx={{textTransform: 'none', mt: 1}}>
                    Book one now
                  </Button>
                </CardContent>
              </Card>
            ) : (
              upcomingAppts.map((a: any) => (
                <AppointmentCard key={a.id} appointment={a} onCancel={setCancelTarget} />
              ))
            )}
          </Box>

          {/* Services */}
          <Box mb={1}>
            <Typography variant="h5" sx={{fontWeight: 600, mb: 2}}>Services</Typography>
            {clinic?.services?.length > 0 ? (
              <ServicesTable services={clinic.services} />
            ) : (
              <Typography variant="body2" color="text.secondary">No services available</Typography>
            )}
          </Box>
        </DashboardPanel>
      </Box>

      <CancelDialog
        appointment={cancelTarget}
        reason={cancelReason}
        onReasonChange={setCancelReason}
        onConfirm={handleCancel}
        onClose={() => { setCancelTarget(null); setCancelReason(''); }}
        loading={cancelling}
      />

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
        anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
      />
    </>
  );
}
