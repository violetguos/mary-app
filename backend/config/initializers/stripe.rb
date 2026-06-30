if ENV["STRIPE_SECRET_KEY"].present?
  Stripe.api_key = ENV["STRIPE_SECRET_KEY"]
  Stripe.api_version = "2025-09-30.pre.1"
end
