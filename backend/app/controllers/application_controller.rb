class ApplicationController < ActionController::API
  def current_user
    token = request.headers["Authorization"]&.split(" ")&.last
    User.find_by(auth_token: token) if token
  end
end
