import {useState} from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {Elements, CardElement, useStripe, useElements} from '@stripe/react-stripe-js';
import {gql} from '@apollo/client';
import {useMutation} from '@apollo/client/react';
import {Box, Button, Typography, CircularProgress, Divider} from '@mui/material';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const isMock = !stripeKey || stripeKey.includes('REPLACE_ME');
const stripePromise = isMock ? null : loadStripe(stripeKey);

const PROCESS_PAYMENT_MUTATION = gql`
  mutation ProcessPayment($appointmentId: ID!, $methodType: String!, $paymentMethodId: String) {
    processPayment(input: {appointmentId: $appointmentId, methodType: $methodType, paymentMethodId: $paymentMethodId}) {
      payment { id amountCents paymentMethod status }
      errors
    }
  }
`;

function MockPaymentForm({appointmentId, amountCents, onComplete}: {
  appointmentId: string;
  amountCents: number;
  onComplete: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processPayment] = useMutation(PROCESS_PAYMENT_MUTATION);

  const handleCardPayment = async () => {
    setProcessing(true);
    setError(null);

    const {data} = await processPayment({
      variables: {
        appointmentId,
        methodType: 'credit_card',
        paymentMethodId: 'pm_mock_card',
      },
    });

    const result = data?.processPayment;
    if (result?.errors?.length) {
      setError(result.errors.join(', '));
    } else {
      onComplete();
    }
    setProcessing(false);
  };

  const handleInsurancePayment = async () => {
    setProcessing(true);
    setError(null);

    const {data} = await processPayment({
      variables: {
        appointmentId,
        methodType: 'insurance',
      },
    });

    const result = data?.processPayment;
    if (result?.errors?.length) {
      setError(result.errors.join(', '));
    } else {
      onComplete();
    }
    setProcessing(false);
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{fontWeight: 600, mb: 2}}>
        Payment — ${(amountCents / 100).toFixed(2)}
      </Typography>

      {error && (
        <Typography variant="body2" color="error" sx={{mb: 1}}>{error}</Typography>
      )}

      <Button
        variant="contained"
        fullWidth
        onClick={handleCardPayment}
        disabled={processing}
        sx={{textTransform: 'none', py: 1.2, mb: 1}}
      >
        {processing ? <CircularProgress size={20} color="inherit" /> : 'Pay with Card'}
      </Button>

      <Divider sx={{my: 1.5}}>or</Divider>

      <Button
        variant="outlined"
        fullWidth
        onClick={handleInsurancePayment}
        disabled={processing}
        sx={{textTransform: 'none', py: 1.2}}
      >
        Use Insurance
      </Button>
    </Box>
  );
}

function LivePaymentForm({appointmentId, amountCents, onComplete}: {
  appointmentId: string;
  amountCents: number;
  onComplete: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processPayment] = useMutation(PROCESS_PAYMENT_MUTATION);

  const handleCardPayment = async () => {
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);

    const {error: pmError, paymentMethod} = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement)!,
    });

    if (pmError) {
      setError(pmError.message ?? 'Payment failed');
      setProcessing(false);
      return;
    }

    const {data} = await processPayment({
      variables: {
        appointmentId,
        methodType: 'credit_card',
        paymentMethodId: paymentMethod.id,
      },
    });

    const result = data?.processPayment;
    if (result?.errors?.length) {
      setError(result.errors.join(', '));
    } else {
      onComplete();
    }
    setProcessing(false);
  };

  const handleInsurancePayment = async () => {
    setProcessing(true);
    setError(null);

    const {data} = await processPayment({
      variables: {
        appointmentId,
        methodType: 'insurance',
      },
    });

    const result = data?.processPayment;
    if (result?.errors?.length) {
      setError(result.errors.join(', '));
    } else {
      onComplete();
    }
    setProcessing(false);
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{fontWeight: 600, mb: 2}}>
        Payment — ${(amountCents / 100).toFixed(2)}
      </Typography>

      <Box sx={{mb: 2, p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 1, bgcolor: 'grey.50'}}>
        <CardElement
          options={{
            style: {
              base: {fontSize: '16px', color: '#424770', '::placeholder': {color: '#aab7c4'}},
              invalid: {color: '#9e2146'},
            },
          }}
        />
      </Box>

      {error && (
        <Typography variant="body2" color="error" sx={{mb: 1}}>{error}</Typography>
      )}

      <Button
        variant="contained"
        fullWidth
        onClick={handleCardPayment}
        disabled={!stripe || processing}
        sx={{textTransform: 'none', py: 1.2, mb: 1}}
      >
        {processing ? <CircularProgress size={20} color="inherit" /> : 'Pay with Card'}
      </Button>

      <Divider sx={{my: 1.5}}>or</Divider>

      <Button
        variant="outlined"
        fullWidth
        onClick={handleInsurancePayment}
        disabled={processing}
        sx={{textTransform: 'none', py: 1.2}}
      >
        Use Insurance
      </Button>
    </Box>
  );
}

export default function StripePaymentForm(props: {
  appointmentId: string;
  amountCents: number;
  onComplete: () => void;
}) {
  if (isMock) {
    return <MockPaymentForm {...props} />;
  }

  return (
    <Elements stripe={stripePromise}>
      <LivePaymentForm {...props} />
    </Elements>
  );
}
