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
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
}

function isWeekend(date: Date) {
  return date.getDay() === 0 || date.getDay() === 6;
}

function isPastDate(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

function MonthCalendar({selectedDate, onSelect}: {selectedDate: Date | null; onSelect: (d: Date) => void}) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else { setViewMonth(m => m - 1); }
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else { setViewMonth(m => m + 1); }
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Button size="small" onClick={prevMonth} sx={{minWidth: 36, p: 0.5}}>&lt;</Button>
        <Typography variant="subtitle1" fontWeight={600}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Typography>
        <Button size="small" onClick={nextMonth} sx={{minWidth: 36, p: 0.5}}>&gt;</Button>
      </Box>
      <Grid container spacing={0.5}>
        {DAY_NAMES.map(d => (
          <Grid item key={d} xs={12 / 7}>
            <Typography variant="caption" textAlign="center" display="block" color="text.secondary" fontWeight={600}>
              {d}
            </Typography>
          </Grid>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <Grid item key={`pad-${i}`} xs={12 / 7} />;
          const date = new Date(viewYear, viewMonth, day);
          const disabled = isPastDate(date) || isWeekend(date);
          const selected = selectedDate && formatDate(selectedDate) === formatDate(date);
          return (
            <Grid item key={`day-${day}`} xs={12 / 7}>
              <Button
                fullWidth
                disabled={disabled}
                variant={selected ? 'contained' : 'text'}
                onClick={() => onSelect(date)}
                sx={{
                  minWidth: 32, minHeight: 36, p: 0,
                  textTransform: 'none', fontWeight: selected ? 700 : 400,
                  fontSize: '0.875rem',
                  color: disabled ? 'grey.400' : selected ? 'white' : 'text.primary',
                  bgcolor: selected ? 'primary.main' : 'transparent',
                  '&:hover': disabled ? {} : {bgcolor: selected ? 'primary.dark' : 'primary.50'},
                  borderRadius: '50%',
                }}
              >
                {day}
              </Button>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
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
                {/* Date picker — month calendar */}
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Date</Typography>
                <Box mb={3}>
                  <MonthCalendar
                    selectedDate={selectedDate}
                    onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                  />
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
