FactoryBot.define do
  factory :activity do
    activity_type { "MyString" }
    description { "MyString" }
    quantity { "9.99" }
    unit { "MyString" }
    emission_kg { "9.99" }
    occurred_at { "2025-12-26 13:13:19" }
  end
end
