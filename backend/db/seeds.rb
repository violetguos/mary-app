default_clinic = Clinic.find_or_create_by!(subdomain: "mary") do |c|
  c.name = "Mary Wellness Clinic"
  c.address = "123 Main Street, Toronto, ON"
  c.phone = "(416) 555-0123"
  c.email = "hello@marywellness.com"
end

services = [
  { name: "Registered Massage Therapy", duration_minutes: 60, price_cents: 12000, category: "rmt" },
  { name: "Physiotherapy Assessment", duration_minutes: 45, price_cents: 10000, category: "physio" },
  { name: "Physiotherapy Follow-up", duration_minutes: 30, price_cents: 7500, category: "physio" },
  { name: "Psychotherapy Session", duration_minutes: 50, price_cents: 15000, category: "psych" },
  { name: "Naturopathic Consultation", duration_minutes: 60, price_cents: 13500, category: "naturopath" },
  { name: "Acupuncture", duration_minutes: 45, price_cents: 9000, category: "naturopath" },
  { name: "Facial Treatment", duration_minutes: 60, price_cents: 11000, category: "beauty" },
]

services.each do |attrs|
  default_clinic.services.find_or_create_by!(name: attrs[:name]) do |s|
    s.duration_minutes = attrs[:duration_minutes]
    s.price_cents = attrs[:price_cents]
    s.category = attrs[:category]
  end
end

admin = User.find_or_create_by!(email: "admin@marywellness.com") do |u|
  u.password = "password123"
  u.role = "clinic_admin"
end

ClinicStaff.find_or_create_by!(user: admin, clinic: default_clinic)

demo_patient = User.find_or_create_by!(email: "patient@marywellness.com") do |u|
  u.password = "password123"
  u.role = "patient"
end

PatientProfile.find_or_create_by!(user: demo_patient, clinic: default_clinic) do |p|
  p.first_name = "Jamie"
  p.last_name = "Chen"
  p.phone = "(416) 555-9876"
  p.date_of_birth = Date.new(1992, 5, 14)
end

puts "Seed complete!"
puts "  Clinic: #{default_clinic.name} (#{default_clinic.subdomain})"
puts "  Services: #{default_clinic.services.count}"
puts "  Admin: admin@marywellness.com / password123"
puts "  Patient: patient@marywellness.com / password123"
