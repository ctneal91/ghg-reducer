require "rails_helper"

RSpec.describe User, type: :model do
  describe "validations" do
    it "is valid with valid attributes" do
      user = User.new(name: "Test User", email: "test@example.com", password: "password123")
      expect(user).to be_valid
    end

    it "requires email" do
      user = User.new(name: "Test User", password: "password123")
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("can't be blank")
    end

    it "requires email to be unique" do
      User.create!(name: "First", email: "test@example.com", password: "password123")
      user = User.new(name: "Second", email: "test@example.com", password: "password123")
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("has already been taken")
    end

    it "requires email to be unique case-insensitively" do
      User.create!(name: "First", email: "test@example.com", password: "password123")
      user = User.new(name: "Second", email: "TEST@EXAMPLE.COM", password: "password123")
      expect(user).not_to be_valid
    end

    it "requires email to be valid format" do
      user = User.new(name: "Test User", email: "invalid-email", password: "password123")
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("is invalid")
    end

    it "requires name" do
      user = User.new(email: "test@example.com", password: "password123")
      expect(user).not_to be_valid
      expect(user.errors[:name]).to include("can't be blank")
    end

    it "requires password on create" do
      user = User.new(name: "Test User", email: "test@example.com")
      expect(user).not_to be_valid
      expect(user.errors[:password]).to include("can't be blank")
    end

    it "requires password to be at least 6 characters" do
      user = User.new(name: "Test User", email: "test@example.com", password: "12345")
      expect(user).not_to be_valid
      expect(user.errors[:password]).to include("is too short (minimum is 6 characters)")
    end

    it "allows password to be blank on update" do
      user = User.create!(name: "Test User", email: "test@example.com", password: "password123")
      user.name = "Updated Name"
      expect(user).to be_valid
    end
  end

  describe "associations" do
    it "has many activities" do
      user = User.create!(name: "Test User", email: "test@example.com", password: "password123")
      activity = Activity.create!(
        activity_type: "driving",
        quantity: 100,
        occurred_at: Time.current,
        user: user
      )
      expect(user.activities).to include(activity)
    end

    it "nullifies activities on destroy" do
      user = User.create!(name: "Test User", email: "test@example.com", password: "password123")
      activity = Activity.create!(
        activity_type: "driving",
        quantity: 100,
        occurred_at: Time.current,
        user: user
      )
      user.destroy
      activity.reload
      expect(activity.user_id).to be_nil
    end
  end

  describe "email normalization" do
    it "downcases email on save" do
      user = User.create!(name: "Test User", email: "TEST@EXAMPLE.COM", password: "password123")
      expect(user.email).to eq("test@example.com")
    end
  end

  describe "password authentication" do
    it "authenticates with correct password" do
      user = User.create!(name: "Test User", email: "test@example.com", password: "password123")
      expect(user.authenticate("password123")).to eq(user)
    end

    it "does not authenticate with incorrect password" do
      user = User.create!(name: "Test User", email: "test@example.com", password: "password123")
      expect(user.authenticate("wrongpassword")).to be false
    end
  end
end
