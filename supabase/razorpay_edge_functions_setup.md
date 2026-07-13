# Razorpay Supabase Edge Functions

Set these secrets in the Supabase project before deploying:

```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
supabase secrets set RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Deploy both functions:

```bash
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
```

The Angular app calls:

- `create-razorpay-order`: creates a pending row in `payments`, creates a real Razorpay order, then saves `razorpay_order_id`.
- `verify-razorpay-payment`: verifies `razorpay_order_id|razorpay_payment_id` with HMAC SHA256 using `RAZORPAY_KEY_SECRET`, then marks the payment `SUCCESS` and activates the subscription.

Do not put `RAZORPAY_KEY_SECRET` in Angular, local storage, environment files, or any browser-delivered bundle.
