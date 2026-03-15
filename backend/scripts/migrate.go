package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5"
)

func main() {
	fmt.Println("🚀 Проверка и обновление БД MarSo Loyalty")
	fmt.Println("======================================")

	// Параметры подключения
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := "marso_loyalty"

	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		dbUser, dbPassword, dbHost, dbPort, dbName)

	ctx := context.Background()

	fmt.Printf("Подключаемся к БД '%s'...\n", dbName)
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		log.Fatalf("❌ Не удалось подключиться к БД: %v", err)
	}
	defer conn.Close(ctx)
	fmt.Println("✅ Подключение успешно")

	// Список таблиц, которые должны быть
	requiredTables := []string{
		"clients",
		"visits",
		"transactions",
		"qr_tokens",
		"admin_users",
	}

	fmt.Println("\n🔍 Проверяем наличие таблиц...")
	for _, table := range requiredTables {
		var exists bool
		err := conn.QueryRow(ctx,
			"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
			table).Scan(&exists)

		if err != nil {
			fmt.Printf("⚠️  Ошибка при проверке таблицы %s: %v\n", table, err)
			continue
		}

		if exists {
			fmt.Printf("✅ Таблица %s существует\n", table)
		} else {
			fmt.Printf("❌ Таблица %s ОТСУТСТВУЕТ!\n", table)

			// Создаём недостающую таблицу
			switch table {
			case "qr_tokens":
				fmt.Println("  Создаём таблицу qr_tokens...")
				_, err := conn.Exec(ctx, `
					CREATE TABLE qr_tokens (
						id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
						client_id   UUID REFERENCES clients(id) ON DELETE CASCADE,
						token       VARCHAR(100) UNIQUE NOT NULL,
						used        BOOLEAN DEFAULT FALSE,
						expires_at  TIMESTAMPTZ NOT NULL,
						created_at  TIMESTAMPTZ DEFAULT NOW()
					)
				`)
				if err != nil {
					fmt.Printf("  ⚠️  Ошибка создания: %v\n", err)
				} else {
					fmt.Println("  ✅ Таблица qr_tokens создана")
				}

			case "transactions":
				fmt.Println("  Создаём таблицу transactions...")
				_, err := conn.Exec(ctx, `
					CREATE TABLE transactions (
						id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
						client_id   UUID REFERENCES clients(id) ON DELETE CASCADE,
						type        VARCHAR(20) NOT NULL,
						amount      DECIMAL(12,2) NOT NULL,
						description TEXT,
						visit_id    UUID REFERENCES visits(id) ON DELETE SET NULL,
						created_at  TIMESTAMPTZ DEFAULT NOW()
					)
				`)
				if err != nil {
					fmt.Printf("  ⚠️  Ошибка создания: %v\n", err)
				} else {
					fmt.Println("  ✅ Таблица transactions создана")
				}
			}
		}
	}

	// Проверяем наличие колонки level в clients
	fmt.Println("\n🔍 Проверяем структуру таблицы clients...")
	checkColumn(ctx, conn, "clients", "level", "VARCHAR(20) DEFAULT 'bronze'")
	checkColumn(ctx, conn, "clients", "total_spent", "DECIMAL(12,2) DEFAULT 0")
	checkColumn(ctx, conn, "clients", "balance", "DECIMAL(12,2) DEFAULT 0")

	// Создаём индексы если нужно
	fmt.Println("\n🔍 Проверяем индексы...")
	_, err = conn.Exec(ctx, `
		CREATE INDEX IF NOT EXISTS idx_qr_tokens_token_expires 
		ON qr_tokens(token, expires_at, used)
	`)
	if err != nil {
		fmt.Printf("⚠️  Ошибка создания индекса: %v\n", err)
	} else {
		fmt.Println("✅ Индекс для qr_tokens создан/существует")
	}

	fmt.Println("\n======================================")
	fmt.Println("🎉 Проверка структуры БД завершена!")
	fmt.Println("🚀 Теперь /api/card должен работать корректно")
	fmt.Println("======================================")
}

func checkColumn(ctx context.Context, conn *pgx.Conn, table, column, definition string) {
	var exists bool
	err := conn.QueryRow(ctx,
		"SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = $1 AND column_name = $2)",
		table, column).Scan(&exists)

	if err != nil {
		fmt.Printf("⚠️  Ошибка при проверке колонки %s.%s: %v\n", table, column, err)
		return
	}

	if !exists {
		fmt.Printf("➕ Добавляем колонку %s в таблицу %s...\n", column, table)
		_, err := conn.Exec(ctx, fmt.Sprintf("ALTER TABLE %s ADD COLUMN %s %s", table, column, definition))
		if err != nil {
			fmt.Printf("  ⚠️  Ошибка: %v\n", err)
		} else {
			fmt.Printf("  ✅ Колонка %s добавлена\n", column)
		}
	} else {
		fmt.Printf("✅ Колонка %s.%s существует\n", table, column)
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
