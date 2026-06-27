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

practitioners_data = [
  { email: "sarah@marywellness.com", first_name: "Sarah", last_name: "Chen",
    bio: "Registered massage therapist with 8 years of experience specializing in deep tissue and sports massage.",
    photo_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop", years_experience: 8,
    service_names: ["Registered Massage Therapy"] },
  { email: "marcus@marywellness.com", first_name: "Marcus", last_name: "Wong",
    bio: "Physiotherapist focused on rehabilitation and recovery. Certified in manual therapy and acupuncture.",
    photo_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop", years_experience: 12,
    service_names: ["Physiotherapy Assessment", "Physiotherapy Follow-up", "Acupuncture"] },
  { email: "elena@marywellness.com", first_name: "Elena", last_name: "Rodriguez",
    bio: "Licensed psychotherapist specializing in CBT, anxiety management, and mindfulness-based therapy.",
    photo_url: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop", years_experience: 10,
    service_names: ["Psychotherapy Session"] },
  { email: "james@marywellness.com", first_name: "James", last_name: "Park",
    bio: "Naturopathic doctor with a focus on integrative medicine, nutrition, and herbal remedies.",
    photo_url: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop", years_experience: 6,
    service_names: ["Naturopathic Consultation", "Acupuncture"] },
  { email: "olivia@marywellness.com", first_name: "Olivia", last_name: "Taylor",
    bio: "Licensed esthetician specializing in facials, skincare treatments, and holistic beauty therapies.",
    photo_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop", years_experience: 5,
    service_names: ["Facial Treatment"] },
]

practitioners_data.each do |data|
  user = User.find_or_create_by!(email: data[:email]) do |u|
    u.password = "password123"
    u.role = "practitioner"
  end

  profile = PractitionerProfile.find_or_create_by!(user: user, clinic: default_clinic) do |p|
    p.bio = data[:bio]
    p.photo_url = data[:photo_url]
    p.years_experience = data[:years_experience]
  end

  data[:service_names].each do |svc_name|
    service = default_clinic.services.find_by!(name: svc_name)
    ServicePractitioner.find_or_create_by!(service: service, practitioner_profile: profile)
  end

  (1..5).each do |day|
    ScheduleAvailability.find_or_create_by!(practitioner_profile: profile, day_of_week: day) do |s|
      s.start_time = "09:00"
      s.end_time = "17:00"
    end
  end
end

puts "Seed complete!"
puts "  Clinic: #{default_clinic.name} (#{default_clinic.subdomain})"
puts "  Services: #{default_clinic.services.count}"
puts "  Practitioners: #{default_clinic.practitioner_profiles.count}"
puts "  Admin: admin@marywellness.com / password123"
puts "  Patient: patient@marywellness.com / password123"
