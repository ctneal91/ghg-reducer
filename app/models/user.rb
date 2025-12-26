class User < ApplicationRecord
  has_secure_password

  has_many :activities, dependent: :nullify

  validates :email, presence: true, uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :password, length: { minimum: 6 }, on: :create

  before_save :downcase_email

  private

  def downcase_email
    self.email = email.downcase
  end
end
