# Create sample activities for development/demo purposes

puts "Creating sample activities..."

sample_activities = [
  { activity_type: "driving", description: "Daily commute to work", quantity: 30, occurred_at: 1.day.ago },
  { activity_type: "driving", description: "Weekend grocery run", quantity: 15, occurred_at: 3.days.ago },
  { activity_type: "flight", description: "Business trip to NYC", quantity: 800, occurred_at: 1.week.ago },
  { activity_type: "electricity", description: "Monthly home usage", quantity: 450, occurred_at: 2.days.ago },
  { activity_type: "natural_gas", description: "Home heating", quantity: 25, occurred_at: 1.week.ago },
  { activity_type: "food_beef", description: "Steak dinner", quantity: 0.5, occurred_at: 4.days.ago },
  { activity_type: "food_chicken", description: "Chicken meal prep", quantity: 2, occurred_at: 2.days.ago },
  { activity_type: "purchase", description: "New electronics", quantity: 200, occurred_at: 5.days.ago }
]

sample_activities.each do |attrs|
  Activity.find_or_create_by!(attrs)
end

puts "Created #{Activity.count} activities"
puts "Total emissions: #{Activity.sum(:emission_kg).round(2)} kg CO2"
