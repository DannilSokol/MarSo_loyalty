-- Замени пароль на реальный bcrypt хэш
-- Сгенерируй хэш: go run scripts/generate_admin_password.go marso123
UPDATE admin_users
SET password_hash = '$2a$10$o203bNe3AG1bn8IS2NsnlOyPgXuNuPSE.tw1qFBWznXQTBwcPVQyW'
WHERE login = 'admin';