package main

import (
	"context"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"go.mod/internal/config"
	"go.mod/internal/database"
	"go.mod/internal/handlers"
	"go.mod/internal/middleware"
	"go.mod/internal/repository"
)

func main() {
	config.Load()
	database.Connect()

	r := gin.Default()

	// CORS (для разработки; в проде лучше вынести в .env или использовать gin-contrib/cors)
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	api := r.Group("/api")

	// Публичные роуты
	{
		api.POST("/auth/login", handlers.Auth.Login)
		api.POST("/admin/login", handlers.Admin.AdminLoginJWT)
	}

	// Клиентские защищённые
	client := api.Group("/")
	client.Use(middleware.ClientAuthMiddleware())
	{
		client.GET("/profile", handlers.Client.GetProfile)
		client.PUT("/profile", handlers.Client.UpdateProfile)
		client.GET("/card", handlers.Loyalty.GetLoyaltyCard)
		client.POST("/validate-scan", handlers.Loyalty.ValidateScan)
	}

	// Админские защищённые
	admin := api.Group("/admin")
	admin.Use(middleware.AdminJWTMiddleware())
	{
		admin.GET("/clients/:id/visits", handlers.Admin.GetClientVisits)
		admin.GET("/clients", handlers.Admin.GetAllClients)
		admin.DELETE("/clients/:id", handlers.Admin.DeleteClient)
		admin.GET("/clients/:id", handlers.Admin.GetClientById)
		admin.POST("/visits-with-bonus", handlers.Visit.CreateVisitWithBonus)
		admin.POST("/scan-qr", handlers.Loyalty.ScanQR)
		admin.GET("/clients/:id/balance", handlers.Admin.GetClientBalance)
		client.GET("/referral-stats", handlers.Refer.GetReferralStats)
		// Статистика с поддержкой фильтров по периоду
		admin.GET("/stats", func(c *gin.Context) {
			period := c.Query("period")
			startStr := c.Query("start")
			endStr := c.Query("end")

			var start, end time.Time
			var err error

			// Если передан custom период
			if startStr != "" && endStr != "" {
				start, err = time.Parse("2006-01-02", startStr)
				if err != nil {
					c.JSON(400, gin.H{"error": "Неверный формат даты start (ожидается YYYY-MM-DD)"})
					return
				}
				end, err = time.Parse("2006-01-02", endStr)
				if err != nil {
					c.JSON(400, gin.H{"error": "Неверный формат даты end (ожидается YYYY-MM-DD)"})
					return
				}
				if end.Before(start) {
					c.JSON(400, gin.H{"error": "Дата end не может быть раньше start"})
					return
				}
			} else if period != "" {
				// Дефолтные периоды
				now := time.Now()
				switch period {
				case "today":
					start = now.Truncate(24 * time.Hour)
					end = now
				case "week":
					start = now.AddDate(0, 0, -7)
					end = now
				case "month":
					start = now.AddDate(0, -1, 0)
					end = now
				case "quarter":
					start = now.AddDate(0, -3, 0)
					end = now
				case "year":
					start = now.AddDate(-1, 0, 0)
					end = now
				default:
					start = now.AddDate(0, -1, 0) // месяц по умолчанию
					end = now
				}
			} else {
				// Если ничего не передали — месяц по умолчанию
				now := time.Now()
				start = now.AddDate(0, -1, 0)
				end = now
			}

			stats, err := repository.Repo.GetAdminStats(c.Request.Context(), start, end)
			if err != nil {
				log.Printf("GetAdminStats error: %v", err)
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}

			c.JSON(200, stats)
		})
	}

	// Health & info
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "marso-loyalty"})
	})

	r.GET("/version", func(c *gin.Context) {
		c.JSON(200, gin.H{"version": "1.0.0", "service": "marso-loyalty"})
	})

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message":  "MarSo Loyalty API",
			"version":  "1.0.0",
			"frontend": "http://localhost:3000",
		})
	})

	// Периодические задачи (cron) — раз в сутки
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		ctx := context.Background()

		// Запуск сразу при старте сервера
		performCronTasks(ctx)

		// Затем каждые 24 часа
		for range ticker.C {
			performCronTasks(ctx)
		}
	}()

	log.Printf("🚀 Go API Server starting on :%s at %s", config.C.Port, time.Now().Format("2006-01-02 15:04:05"))
	log.Println("🌐 React Frontend: http://localhost:3000")
	log.Printf("📊 API base: http://localhost:%s/api", config.C.Port)

	if err := r.Run(":" + config.C.Port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

// performCronTasks — все периодические задачи
func performCronTasks(ctx context.Context) {
	log.Println("Cron: Starting periodic tasks...")

	// 1. Понижение уровня неактивным клиентам
	if err := repository.Repo.DowngradeInactiveClients(ctx); err != nil {
		log.Printf("Cron: DowngradeInactiveClients error: %v", err)
	} else {
		log.Println("Cron: DowngradeInactiveClients completed")
	}

	// 2. Сгорание всех бонусов у клиентов, которые не приходили >180 дней
	clients, err := repository.Repo.GetAllClients(ctx)
	if err != nil {
		log.Printf("Cron: GetAllClients error: %v", err)
		log.Println("Cron: Periodic tasks completed")
		return
	}

	log.Printf("Cron: Checking inactive clients for bonus burn (%d clients total)", len(clients))

	var burnedTotal float64 = 0.0
	var affectedClients int = 0

	for _, client := range clients {
		tx, txErr := database.DB.Begin(ctx)
		if txErr != nil {
			log.Printf("Cron: Burn tx begin error for client %s: %v", client.ID, txErr)
			continue
		}

		burned, burnErr := repository.Repo.BurnInactiveBonuses(ctx, tx, client.ID)
		if burnErr != nil {
			tx.Rollback(ctx)
			log.Printf("Cron: BurnInactiveBonuses error for client %s: %v", client.ID, burnErr)
			continue
		}

		commitErr := tx.Commit(ctx)
		if commitErr != nil {
			log.Printf("Cron: Burn commit error for client %s: %v", client.ID, commitErr)
			continue
		}

		if burned > 0 {
			affectedClients++
			burnedTotal += burned
			log.Printf("Cron: Burned %.2f bonuses for inactive client %s (no visit >180 days)", burned, client.ID)
		}
	}

	if affectedClients > 0 {
		log.Printf("Cron: Burned total %.2f bonuses for %d inactive clients", burnedTotal, affectedClients)
	} else {
		log.Println("Cron: No inactive clients with bonuses to burn")
	}

	log.Println("Cron: Periodic tasks completed")
}
