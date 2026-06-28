import {type ReactNode, useState} from 'react';
import {createLazyFileRoute, useNavigate} from '@tanstack/react-router';
import {gql} from '@apollo/client';
import {useQuery, useMutation} from '@apollo/client/react';
import {
  Box, Typography, Avatar, Chip, Button, CircularProgress, Alert,
  Card, CardContent, Snackbar,
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

type PractitionerSummary = {
  id: string;
  user: {email: string};
  bio: string;
  photoUrl?: string | null;
  yearsExperience?: number;
  services: Array<{id: string; name: string; durationMinutes: number}>;
};

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

function isToday(date: Date) {
  return formatDate(date) === formatDate(new Date());
}

function BookingLayout({sidebar, content}: {sidebar: ReactNode; content: ReactNode}) {
  return (
    <Box sx={{display: 'flex', flexDirection: {xs: 'column', md: 'row'}, width: '100%', minHeight: '100vh', bgcolor: '#f5f5f5'}}>
      <Box sx={{
        flex: {xs: '0 0 auto', md: '0 0 20%'},
        width: {xs: '100%', md: '20%'},
        minWidth: {xs: '100%', md: '20%'},
        maxWidth: {xs: '100%', md: '20%'},
        borderRight: {md: '1px solid rgba(0,0,0,0.12)'},
        borderBottom: {xs: '1px solid rgba(0,0,0,0.12)', md: 0},
        bgcolor: 'white',
        display: 'flex',
        flexDirection: 'column',
        minHeight: {xs: 'auto', md: '100vh'},
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}>
        {sidebar}
      </Box>

      <Box sx={{flex: 1, minWidth: 0, minHeight: '100vh', overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', p: {xs: 2, md: 3}}}>
        {content}
      </Box>
    </Box>
  );
}

function BookingEmptyState({message}: {message: string}) {
  return (
    <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minHeight: '50vh'}}>
      <Typography variant="h6" color="text.secondary" sx={{fontWeight: 400}}>
        {message}
      </Typography>
    </Box>
  );
}

function BookingPanel({children}: {children: ReactNode}) {
  return (
    <Box sx={{width: '100%', maxWidth: 980, p: {xs: 2, md: 4}, bgcolor: 'white', borderRadius: 3, boxShadow: '0 12px 30px rgba(0,0,0,0.08)'}}>
      {children}
    </Box>
  );
}

function BookingPrimaryButton({children, loading, onClick}: {children: ReactNode; loading: boolean; onClick: () => void}) {
  return (
    <Button
      variant="contained"
      size="large"
      onClick={onClick}
      disabled={loading}
      sx={{textTransform: 'none', px: 6, py: 1.5, fontSize: 16}}
    >
      {children}
    </Button>
  );
}

function PractitionerCard({practitioner, selected, onSelect}: {practitioner: PractitionerSummary; selected: boolean; onSelect: () => void}) {
  return (
    <Card
      variant="outlined"
      sx={{
        mx: 1.5, my: 1, cursor: 'pointer', transition: 'all 0.12s',
        borderColor: selected ? 'primary.main' : 'grey.200',
        bgcolor: selected ? 'primary.50' : 'white',
        '&:hover': {borderColor: 'primary.light'},
      }}
      onClick={onSelect}
    >
      <CardContent sx={{p: 1.5, '&:last-child': {pb: 1.5}}}>
        <Box sx={{display: 'flex', gap: 1.5, alignItems: 'flex-start'}}>
          <Avatar src={practitioner.photoUrl ?? undefined} alt={practitioner.user.email} sx={{width: 44, height: 44}} />
          <Box sx={{flex: 1, minWidth: 0}}>
            <Typography variant="subtitle2" noWrap sx={{fontWeight: 600, fontSize: 13}}>
              {practitioner.user.email.split('@')[0]}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              fontSize: 11,
            }}>{practitioner.bio}</Typography>
            {practitioner.yearsExperience && (
              <Typography variant="caption" color="text.secondary" sx={{display: 'block', fontSize: 11}}>
                {practitioner.yearsExperience} yr{practitioner.yearsExperience !== 1 ? 's' : ''} exp
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function BookingSidebar({
  loading,
  error,
  practitioners,
  selectedPractitioner,
  selectedPractitionerId,
  selectedServiceId,
  onSelectPractitioner,
  onSelectService,
}: {
  loading: boolean;
  error?: Error | null;
  practitioners: PractitionerSummary[];
  selectedPractitioner?: PractitionerSummary;
  selectedPractitionerId: string | null;
  selectedServiceId: string | null;
  onSelectPractitioner: (id: string) => void;
  onSelectService: (id: string) => void;
}) {
  return (
    <>
      <Box sx={{p: 2, borderBottom: 1, borderColor: 'divider'}}>
        <Typography variant="h6" sx={{fontWeight: 600}}>Practitioners</Typography>
      </Box>

      {loading && (
        <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}><CircularProgress size={24} /></Box>
      )}
      {error && <Alert severity="error" sx={{m: 2}}>Failed to load</Alert>}

      {practitioners.map((practitioner) => (
        <PractitionerCard
          key={practitioner.id}
          practitioner={practitioner}
          selected={selectedPractitionerId === practitioner.id}
          onSelect={() => onSelectPractitioner(practitioner.id)}
        />
      ))}

      {selectedPractitioner && (
        <Box sx={{p: 2, borderTop: 1, borderColor: 'divider'}}>
          <Typography variant="overline" color="text.secondary" sx={{fontWeight: 600, fontSize: 11}}>
            SERVICES
          </Typography>
          <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1}}>
            {selectedPractitioner.services.map((service) => (
              <Chip
                key={service.id}
                label={`${service.name} · ${service.durationMinutes}min`}
                color={selectedServiceId === service.id ? 'primary' : 'default'}
                variant={selectedServiceId === service.id ? 'filled' : 'outlined'}
                size="small"
                onClick={() => onSelectService(service.id)}
                sx={{cursor: 'pointer', justifyContent: 'flex-start', width: '100%'}}
              />
            ))}
          </Box>
        </Box>
      )}
    </>
  );
}

function CalendarView({selectedDate, onDateSelect, slots, selectedSlot, onSlotSelect, loading, serviceDuration}:
  {selectedDate: Date | null; onDateSelect: (d: Date) => void; slots: any[]; selectedSlot: string | null; onSlotSelect: (s: string | null) => void; loading: boolean; serviceDuration: number}) {

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Box>
      <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2}}>
        <Button size="small" onClick={() => {
          if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
          else { setViewMonth(m => m - 1); }
        }} sx={{minWidth: 32, p: 0.5, fontSize: 18}}>&lt;</Button>
        <Typography variant="h6" sx={{fontWeight: 600}}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Typography>
        <Button size="small" onClick={() => {
          if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
          else { setViewMonth(m => m + 1); }
        }} sx={{minWidth: 32, p: 0.5, fontSize: 18}}>&gt;</Button>
      </Box>

      <Box sx={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1}}>
        {DAY_NAMES.map((day) => (
          <Typography key={day} variant="caption" align="center" sx={{fontSize: 13, fontWeight: 700}} color="text.secondary">
            {day}
          </Typography>
        ))}
      </Box>
      <Box sx={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1.2, mb: 3}}>
        {cells.map((day, i) => {
          if (day === null) return <Box key={`pad-${i}`} />;
          const date = new Date(viewYear, viewMonth, day);
          const disabled = isPastDate(date) || isWeekend(date);
          const selected = selectedDate && formatDate(selectedDate) === formatDate(date);
          const todayHighlight = isToday(date) && !selected;
          return (
            <Button
              key={`day-${day}`}
              disabled={disabled}
              variant={selected ? 'contained' : 'text'}
              onClick={() => onDateSelect(date)}
              sx={{
                minWidth: 0, minHeight: 48, p: 0,
                textTransform: 'none', fontWeight: selected ? 700 : todayHighlight ? 700 : 500,
                fontSize: '1rem',
                color: disabled ? 'grey.300' : selected ? 'white' : 'text.primary',
                bgcolor: selected ? 'primary.main' : todayHighlight ? 'primary.50' : 'transparent',
                borderRadius: 1,
                '&:hover': disabled ? {} : {bgcolor: selected ? 'primary.dark' : 'primary.100'},
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {day}
            </Button>
          );
        })}
      </Box>

      {selectedDate && (
        <>
          <Box sx={{borderTop: 1, borderColor: 'divider', pt: 2, mb: 2}}>
            <Typography variant="subtitle1" sx={{fontWeight: 600}}>
              {DAY_NAMES[selectedDate.getDay()]}, {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getDate()}
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}><CircularProgress size={28} /></Box>
          ) : slots.length === 0 ? (
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6}}>
              <Typography variant="body2" color="text.secondary">No available slots for this day</Typography>
            </Box>
          ) : (
            <Box>
              {slots.map((slot: any) => {
                const time = formatTime(slot.startAt);
                const isSelected = selectedSlot === slot.startAt;
                return (
                  <Box
                    key={slot.startAt}
                    onClick={() => { if (slot.available) onSlotSelect(isSelected ? null : slot.startAt); }}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 2.5, px: 3, py: 1.5,
                      cursor: slot.available ? 'pointer' : 'default',
                      bgcolor: isSelected ? 'primary.main' : slot.available ? 'transparent' : 'grey.50',
                      color: isSelected ? 'white' : slot.available ? 'text.primary' : 'grey.400',
                      borderRadius: 1,
                      borderBottom: '1px solid',
                      borderColor: 'grey.100',
                      transition: 'all 0.12s',
                      '&:hover': slot.available && !isSelected ? {bgcolor: 'primary.50'} : {},
                    }}
                  >
                    <Typography variant="body1" sx={{fontWeight: 700, width: 88, flexShrink: 0}}>
                      {time}
                    </Typography>
                    <Box
                      sx={{
                        flex: 1, height: 40, borderRadius: 1,
                        bgcolor: isSelected ? 'rgba(255,255,255,0.2)' : (slot.available ? 'primary.100' : 'grey.200'),
                        display: 'flex', alignItems: 'center', px: 2.5,
                      }}
                    >
                      <Typography variant="body2" sx={{fontWeight: 600}}>
                        {slot.available ? (isSelected ? 'Selected' : 'Available') : 'Unavailable'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color={isSelected ? 'rgba(255,255,255,0.7)' : 'text.secondary'} sx={{width: 64, textAlign: 'right', flexShrink: 0}}>
                      {serviceDuration}min
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </>
      )}
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

  const {loading: loadingPractitioners, error: pracError, data: pracData} = useQuery<{practitioners: any[]}>(PRACTITIONERS_QUERY, {
    variables: {clinicId},
  });

  const practitioners = pracData?.practitioners || [];
  const selectedPractitioner = practitioners.find((p: any) => p.id === selectedPractitionerId);
  const selectedServiceObj = selectedPractitioner?.services?.find((s: any) => s.id === selectedServiceId);

  const {data: slotsData, loading: loadingSlots} = useQuery<{availableSlots: any[]}>(SLOTS_QUERY, {
    variables: {
      practitionerProfileId: selectedPractitionerId,
      serviceId: selectedServiceId,
      date: selectedDate ? formatDate(selectedDate) : '',
    },
    skip: !selectedPractitionerId || !selectedServiceId || !selectedDate,
  });

  const [bookAppointment, {loading: booking}] = useMutation<{bookAppointment: {appointment?: {id: string; startsAt: string}; errors?: string[]}}>(BOOK_MUTATION);

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
    <BookingLayout
      sidebar={(
        <BookingSidebar
          loading={loadingPractitioners}
          error={pracError}
          practitioners={practitioners}
          selectedPractitioner={selectedPractitioner}
          selectedPractitionerId={selectedPractitionerId}
          selectedServiceId={selectedServiceId}
          onSelectPractitioner={(id) => {
            setSelectedPractitionerId(id);
            setSelectedServiceId(null);
            setSelectedDate(null);
            setSelectedSlot(null);
          }}
          onSelectService={(id) => {
            setSelectedServiceId(id);
            setSelectedDate(null);
            setSelectedSlot(null);
          }}
        />
      )}
      content={(
        <>
          {!selectedPractitioner ? (
            <BookingEmptyState message="Select a practitioner" />
          ) : !selectedServiceId ? (
            <BookingEmptyState message="Select a service" />
          ) : (
            <BookingPanel>
              <CalendarView
                selectedDate={selectedDate}
                onDateSelect={(date) => { setSelectedDate(date); setSelectedSlot(null); }}
                slots={slotsData?.availableSlots || []}
                selectedSlot={selectedSlot}
                onSlotSelect={setSelectedSlot}
                loading={loadingSlots}
                serviceDuration={selectedServiceObj?.durationMinutes || 0}
              />

              {selectedSlot && (
                <Box sx={{display: 'flex', justifyContent: 'center', mt: 4}}>
                  <BookingPrimaryButton loading={booking} onClick={handleBook}>
                    {booking ? 'Booking...' : `Confirm — ${formatTime(selectedSlot)}`}
                  </BookingPrimaryButton>
                </Box>
              )}
            </BookingPanel>
          )}

          <Snackbar
            open={!!snackbar}
            autoHideDuration={4000}
            onClose={() => setSnackbar(null)}
            message={snackbar}
            anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
          />
        </>
      )}
    />
  );
}
