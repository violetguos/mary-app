# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_06_01_000012) do
  create_table "appointments", force: :cascade do |t|
    t.string "cancellation_reason"
    t.datetime "cancelled_at"
    t.integer "cancelled_by_id"
    t.integer "clinic_id", null: false
    t.datetime "created_at", null: false
    t.datetime "ends_at", null: false
    t.integer "late_fee_cents"
    t.integer "no_show_fee_cents"
    t.integer "patient_id", null: false
    t.integer "service_id", null: false
    t.integer "staff_id"
    t.datetime "starts_at", null: false
    t.string "status", default: "scheduled", null: false
    t.datetime "updated_at", null: false
    t.index ["clinic_id"], name: "index_appointments_on_clinic_id"
    t.index ["patient_id"], name: "index_appointments_on_patient_id"
    t.index ["service_id"], name: "index_appointments_on_service_id"
    t.index ["staff_id"], name: "index_appointments_on_staff_id"
    t.index ["starts_at"], name: "index_appointments_on_starts_at"
    t.index ["status"], name: "index_appointments_on_status"
  end

  create_table "audit_logs", force: :cascade do |t|
    t.string "action", null: false
    t.integer "actor_id"
    t.datetime "created_at", null: false
    t.json "details"
    t.string "ip_address"
    t.integer "resource_id"
    t.string "resource_type", null: false
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.index ["actor_id"], name: "index_audit_logs_on_actor_id"
    t.index ["created_at"], name: "index_audit_logs_on_created_at"
  end

  create_table "clinic_staff", force: :cascade do |t|
    t.integer "clinic_id", null: false
    t.datetime "created_at", null: false
    t.json "permissions"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["clinic_id"], name: "index_clinic_staff_on_clinic_id"
    t.index ["user_id"], name: "index_clinic_staff_on_user_id"
  end

  create_table "clinics", force: :cascade do |t|
    t.string "address"
    t.datetime "created_at", null: false
    t.string "email"
    t.string "name", null: false
    t.string "phone"
    t.string "subdomain", null: false
    t.datetime "updated_at", null: false
    t.index ["subdomain"], name: "index_clinics_on_subdomain", unique: true
  end

  create_table "form_submissions", force: :cascade do |t|
    t.json "answers", null: false
    t.integer "clinic_id", null: false
    t.datetime "created_at", null: false
    t.integer "form_template_id", null: false
    t.string "ip_address"
    t.integer "patient_id", null: false
    t.datetime "signed_at"
    t.datetime "updated_at", null: false
    t.index ["clinic_id"], name: "index_form_submissions_on_clinic_id"
    t.index ["form_template_id"], name: "index_form_submissions_on_form_template_id"
    t.index ["patient_id"], name: "index_form_submissions_on_patient_id"
  end

  create_table "form_templates", force: :cascade do |t|
    t.boolean "active", default: true
    t.integer "clinic_id", null: false
    t.datetime "created_at", null: false
    t.json "fields", null: false
    t.string "name", null: false
    t.boolean "required", default: false
    t.datetime "updated_at", null: false
    t.index ["clinic_id"], name: "index_form_templates_on_clinic_id"
  end

  create_table "insurance_claims", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "payment_id", null: false
    t.string "policy_number", null: false
    t.string "provider_name", null: false
    t.json "response_payload"
    t.string "status", default: "draft", null: false
    t.datetime "submitted_at"
    t.datetime "updated_at", null: false
    t.index ["payment_id"], name: "index_insurance_claims_on_payment_id"
  end

  create_table "patient_profiles", force: :cascade do |t|
    t.integer "clinic_id", null: false
    t.datetime "created_at", null: false
    t.string "credit_card_token"
    t.date "date_of_birth"
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.string "phone"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["clinic_id"], name: "index_patient_profiles_on_clinic_id"
    t.index ["user_id"], name: "index_patient_profiles_on_user_id"
  end

  create_table "payments", force: :cascade do |t|
    t.integer "amount_cents", null: false
    t.integer "appointment_id", null: false
    t.datetime "captured_at"
    t.datetime "created_at", null: false
    t.string "method", null: false
    t.integer "patient_id", null: false
    t.string "processor_transaction_id"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["appointment_id"], name: "index_payments_on_appointment_id"
    t.index ["patient_id"], name: "index_payments_on_patient_id"
  end

  create_table "receipts", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "issued_at"
    t.integer "payment_id", null: false
    t.string "receipt_number", null: false
    t.datetime "updated_at", null: false
    t.index ["payment_id"], name: "index_receipts_on_payment_id"
    t.index ["receipt_number"], name: "index_receipts_on_receipt_number", unique: true
  end

  create_table "services", force: :cascade do |t|
    t.string "category"
    t.integer "clinic_id", null: false
    t.datetime "created_at", null: false
    t.integer "duration_minutes", null: false
    t.string "name", null: false
    t.integer "price_cents", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["clinic_id"], name: "index_services_on_clinic_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "auth_token"
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "role", default: "patient", null: false
    t.datetime "updated_at", null: false
    t.index ["auth_token"], name: "index_users_on_auth_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "appointments", "clinics"
  add_foreign_key "appointments", "services"
  add_foreign_key "appointments", "users", column: "patient_id"
  add_foreign_key "appointments", "users", column: "staff_id"
  add_foreign_key "audit_logs", "users", column: "actor_id"
  add_foreign_key "clinic_staff", "clinics"
  add_foreign_key "clinic_staff", "users"
  add_foreign_key "form_submissions", "clinics"
  add_foreign_key "form_submissions", "form_templates"
  add_foreign_key "form_submissions", "users", column: "patient_id"
  add_foreign_key "form_templates", "clinics"
  add_foreign_key "insurance_claims", "payments"
  add_foreign_key "patient_profiles", "clinics"
  add_foreign_key "patient_profiles", "users"
  add_foreign_key "payments", "appointments"
  add_foreign_key "payments", "users", column: "patient_id"
  add_foreign_key "receipts", "payments"
  add_foreign_key "services", "clinics"
end
