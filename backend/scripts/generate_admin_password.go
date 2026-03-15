package main

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Использование: go run scripts/generate_admin_password.go <пароль>")
		fmt.Println("Пример: go run scripts/generate_admin_password.go marso123")
		os.Exit(1)
	}

	password := os.Args[1]

	// Генерируем bcrypt хэш
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("Ошибка генерации хэша: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("=== Генератор пароля для админа ===")
	fmt.Printf("Пароль: %s\n", password)
	fmt.Printf("BCrypt хэш: %s\n", string(hash))
	fmt.Println("\n=== Копируй в миграции ===")
	fmt.Printf("UPDATE admin_users SET password_hash = '%s' WHERE login = 'admin';\n", string(hash))
	fmt.Println("\n=== Или вставь в INSERT ===")
	fmt.Printf("INSERT INTO admin_users (login, password_hash) VALUES ('admin', '%s');\n", string(hash))
}
