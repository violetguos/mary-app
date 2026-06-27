import {useState} from 'react';
import {createLazyFileRoute, useNavigate} from '@tanstack/react-router';
import {gql} from '@apollo/client';
import {useQuery, useMutation} from '@apollo/client/react';
import {
  Box, Typography, Avatar, Chip, Button, CircularProgress, Alert,
  Grid, Paper, Card, CardContent, Snackbar,
} from '@mui/material';
import {useAuth} from '../lib/auth';

export const Route = createLazyFileRoute('/book')({
  component: BookPage,
});

const PRACTITIONERS_QUERY = gql`
  query Practitioners($clinicId: ID!) {
    practitioners(clinicId: $clinicId) {
      id
      user { id email }
      bio
      photoUrl
      yearsExperience
      services { id name durationMinutes priceCents }
    }
  }
`;

const SLOTS_QUERY = gql`
  query AvailableSlots($practitionerProfileId: ID!, $serviceId: ID!, $date: ISO8601Date!) {
    availableSlots(practitionerProfileId: $practitionerProfileId, serviceId: $serviceId, date: $date) {
      startAt
      endAt
      available
    }
  }
`;

const BOOK_MUTATION = gql`
  mutation BookAppointment($practitionerProfileId: ID!, $serviceId: ID!, $startsAt: ISO8601DateTime!) {
    bookAppointment(input: {practitionerProfileId: $practitionerProfileId, serviceId: $serviceId, startsAt: $startsAt}) {
      appointment { id startsAt }
      errors
    }
  }
`;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getNextDays(n: number) {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
}

function BookPage() {
  const {isAuthenticated} = useAuth();
  const navigate = useNavigate();
  const clinicId = '1';

  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  if (!isAuthenticated) {
    navigate({to: '/login'});
    return null;
  }

  const {loading: loadingPractitioners, error: pracError, data: pracData} = useQuery(PRACTITIONERS_QUERY, {
    variables: {clinicId},
  });

  const practitioners = pracData?.practitioners || [];

  const selectedPractitioner = practitioners.find((p: any) => p.id === selectedPractitionerId);

  const {data: slotsData, loading: loadingSlots} = useQuery(SLOTS_QUERY, {
    variables: {
      practitionerProfileId: selectedPractitionerId,
      serviceId: selectedServiceId,
      date: selectedDate ? formatDate(selectedDate) : '',
    },
    skip: !selectedPractitionerId || !selectedServiceId || !selectedDate,
  });

  const [bookAppointment, {loading: booking}] = useMutation(BOOK_MUTATION);

  const handleBook = async () => {
    if (!selectedSlot || !selectedPractitionerId || !selectedServiceId) return;
    try {
      const {data} = await bookAppointment({
        variables: {
          practitionerProfileId: selectedPractitionerId,
          serviceId: selectedServiceId,
          startsAt: selectedSlot,
        },
      });
      const errors = data?.bookAppointment?.errors;
      if (errors?.length) {
        setSnackbar(errors.join(', '));
      } else {
        setSnackbar('Appointment booked!');
        setSelectedSlot(null);
      }
    } catch (e: any) {
      setSnackbar(e.message);
    }
  };

  return (
    <Box display="flex" height="100vh">
      {/* Left sidebar — practitioner list */}
      <Box width="25%" minWidth={280} sx={{borderRight: 1, borderColor: 'divider', overflowY: 'auto', p: 2}}>
        <Typography variant="h6" fontWeight={600} mb={2}>Practitioners</Typography>
        {loadingPractitioners && <CircularProgress size={24} />}
        {pracError && <Alert severity="error" sx={{mb: 1}}>Failed to load</Alert>}
        {practitioners.map((p: any) => (
          <Card
            key={p.id}
            variant="outlined"
            sx={{
              mb: 1.5, cursor: 'pointer', transition: 'all 0.15s',
              borderColor: selectedPractitionerId === p.id ? 'primary.main' : undefined,
              bgcolor: selectedPractitionerId === p.id ? 'primary.50' : undefined,
              '&:hover': {borderColor: 'primary.light'},
            }}
            onClick={() => {
              setSelectedPractitionerId(p.id);
              setSelectedServiceId(null);
              setSelectedDate(null);
              setSelectedSlot(null);
            }}
          >
            <CardContent sx={{p: 1.5, '&:last-child': {pb: 1.5}}}>
              <Box display="flex" gap={1.5} alignItems="flex-start">
                <Avatar src={p.photoUrl} alt={p.user.email} sx={{width: 48, height: 48}} />
                <Box flex={1} minWidth={0}>
                  <Typography variant="subtitle2" fontWeight={600} noWrap>{p.user.email.split('@')[0]}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{p.bio}</Typography>
                  {p.yearsExperience && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {p.yearsExperience} yr{p.yearsExperience !== 1 ? 's' : ''} exp
                    </Typography>
                  )}
                  <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                    {p.services.map((s: any) => (
                      <Chip key={s.id} label={s.name} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Right panel — booking flow */}
      <Box flex={1} p={3} sx={{overflowY: 'auto'}}>
        {!selectedPractitioner ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography variant="h6" color="text.secondary">Select a practitioner to book</Typography>
          </Box>
        ) : (
          <>
            <Typography variant="h5" fontWeight={600} mb={3}>
              Book with {selectedPractitioner.user.email.split('@')[0]}
            </Typography>

            {/* Service selector */}
            <Typography variant="subtitle1" fontWeight={600} mb={1}>Service</Typography>
            <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
              {selectedPractitioner.services.map((s: any) => (
                <Chip
                  key={s.id}
                  label={`${s.name} — $${(s.priceCents / 100).toFixed(2)} (${s.durationMinutes} min)`}
                  color={selectedServiceId === s.id ? 'primary' : 'default'}
                  variant={selectedServiceId === s.id ? 'filled' : 'outlined'}
                  onClick={() => {
                    setSelectedServiceId(s.id);
                    setSelectedDate(null);
                    setSelectedSlot(null);
                  }}
                  sx={{cursor: 'pointer'}}
                />
              ))}
            </Box>

            {selectedServiceId && (
              <>
                {/* Date picker */}
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Date</Typography>
                <Box display="flex" gap={1} mb={3} flexWrap="wrap">
                  {getNextDays(14).map((d) => {
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    const dateStr = formatDate(d);
                    const isSelected = selectedDate && formatDate(selectedDate) === dateStr;
                    return (
                      <Button
                        key={dateStr}
                        variant={isSelected ? 'contained' : 'outlined'}
                        disabled={isWeekend}
                        onClick={() => {
                          setSelectedDate(d);
                          setSelectedSlot(null);
                        }}
                        sx={{textTransform: 'none', minWidth: 80}}
                        size="small"
                      >
                        <Box textAlign="center">
                          <Typography variant="caption" display="block">{DAY_NAMES[d.getDay()]}</Typography>
                          <Typography variant="body2" fontWeight={600}>{d.getDate()}</Typography>
                          <Typography variant="caption" display="block">{MONTH_NAMES[d.getMonth()]}</Typography>
                        </Box>
                      </Button>
                    );
                  })}
                </Box>

                {/* Time slots */}
                {selectedDate && (
                  <>
                    <Typography variant="subtitle1" fontWeight={600} mb={1}>Time</Typography>
                    {loadingSlots ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Grid container spacing={1}>
                        {(slotsData?.availableSlots || []).map((slot: any) => (
                          <Grid item key={slot.startAt}>
                            <Button
                              variant={selectedSlot === slot.startAt ? 'contained' : 'outlined'}
                              color={slot.available ? 'primary' : 'inherit'}
                              disabled={!slot.available}
                              onClick={() => setSelectedSlot(slot.available ? slot.startAt : null)}
                              sx={{
                                textTransform: 'none', minWidth: 90,
                                bgcolor: slot.available
                                  ? (selectedSlot === slot.startAt ? 'primary.main' : 'primary.50')
                                  : 'grey.200',
                                color: slot.available
                                  ? (selectedSlot === slot.startAt ? 'white' : 'primary.main')
                                  : 'grey.500',
                                borderColor: slot.available ? 'primary.main' : 'grey.300',
                                '&:hover': slot.available ? {} : {bgcolor: 'grey.200'},
                              }}
                            >
                              {formatTime(slot.startAt)}
                            </Button>
                          </Grid>
                        ))}
                        {slotsData?.availableSlots?.length === 0 && (
                          <Typography variant="body2" color="text.secondary" p={2}>No available slots for this day</Typography>
                        )}
                      </Grid>
                    )}

                    {selectedSlot && (
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleBook}
                        disabled={booking}
                        sx={{mt: 3, textTransform: 'none'}}
                      >
                        {booking ? 'Booking...' : `Confirm booking — ${formatTime(selectedSlot)}`}
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </Box>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
        anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
      />
    </Box>
  );
}
