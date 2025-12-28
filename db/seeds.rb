# Create user and sample activities for development/demo purposes

puts "Creating user..."

user = User.find_or_create_by!(email: "ctnealherman@gmail.com") do |u|
  u.name = "CT Neal Herman"
  u.password = "app123"
end

puts "User created: #{user.email}"

puts "Creating sample activities..."

# Clear existing activities for this user
user.activities.destroy_all

sample_activities = [
  # Recent week
  { activity_type: "driving", description: "Daily commute to work", quantity: 30, occurred_at: 1.day.ago },
  { activity_type: "driving", description: "Weekend grocery run", quantity: 15, occurred_at: 3.days.ago },
  { activity_type: "electricity", description: "Weekly home usage", quantity: 120, occurred_at: 2.days.ago },
  { activity_type: "food_chicken", description: "Chicken meal prep", quantity: 2, occurred_at: 2.days.ago },

  # 1 week ago
  { activity_type: "driving", description: "Road trip", quantity: 200, occurred_at: 1.week.ago },
  { activity_type: "natural_gas", description: "Home heating", quantity: 25, occurred_at: 1.week.ago },
  { activity_type: "food_beef", description: "Steak dinner", quantity: 0.5, occurred_at: 8.days.ago },
  { activity_type: "electricity", description: "Weekly home usage", quantity: 115, occurred_at: 9.days.ago },

  # 2 weeks ago
  { activity_type: "driving", description: "Daily commute", quantity: 150, occurred_at: 2.weeks.ago },
  { activity_type: "purchase", description: "New electronics", quantity: 200, occurred_at: 2.weeks.ago },
  { activity_type: "electricity", description: "Weekly home usage", quantity: 130, occurred_at: 2.weeks.ago },

  # 3 weeks ago
  { activity_type: "flight", description: "Business trip to NYC", quantity: 800, occurred_at: 3.weeks.ago },
  { activity_type: "driving", description: "Airport transport", quantity: 50, occurred_at: 3.weeks.ago },
  { activity_type: "food_beef", description: "Business dinner", quantity: 0.8, occurred_at: 3.weeks.ago },

  # 1 month ago
  { activity_type: "driving", description: "Monthly commute total", quantity: 600, occurred_at: 1.month.ago },
  { activity_type: "electricity", description: "Monthly home usage", quantity: 450, occurred_at: 1.month.ago },
  { activity_type: "natural_gas", description: "Home heating", quantity: 35, occurred_at: 1.month.ago },
  { activity_type: "food_chicken", description: "Weekly meals", quantity: 3, occurred_at: 1.month.ago },

  # 2 months ago
  { activity_type: "flight", description: "Vacation flight", quantity: 2400, occurred_at: 2.months.ago },
  { activity_type: "driving", description: "Monthly commute", quantity: 550, occurred_at: 2.months.ago },
  { activity_type: "electricity", description: "Monthly usage", quantity: 480, occurred_at: 2.months.ago },
  { activity_type: "purchase", description: "Holiday shopping", quantity: 350, occurred_at: 2.months.ago },
  { activity_type: "food_beef", description: "Holiday meals", quantity: 2, occurred_at: 2.months.ago },

  # 3 months ago
  { activity_type: "driving", description: "Monthly commute", quantity: 620, occurred_at: 3.months.ago },
  { activity_type: "electricity", description: "Monthly usage", quantity: 520, occurred_at: 3.months.ago },
  { activity_type: "natural_gas", description: "Winter heating", quantity: 45, occurred_at: 3.months.ago },
  { activity_type: "food_chicken", description: "Monthly meals", quantity: 5, occurred_at: 3.months.ago },

  # 4 months ago
  { activity_type: "driving", description: "Monthly commute", quantity: 580, occurred_at: 4.months.ago },
  { activity_type: "electricity", description: "Monthly usage", quantity: 490, occurred_at: 4.months.ago },
  { activity_type: "natural_gas", description: "Heating", quantity: 50, occurred_at: 4.months.ago },
  { activity_type: "purchase", description: "Home appliance", quantity: 500, occurred_at: 4.months.ago }
]

sample_activities.each do |attrs|
  user.activities.create!(attrs)
end

puts "Created #{user.activities.count} activities for #{user.email}"
puts "Total emissions: #{user.activities.sum(:emission_kg).round(2)} kg CO2"
