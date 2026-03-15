package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.mod/internal/database"

	"go.mod/internal/repository"
	"go.mod/internal/utils"
)

type AdminHandler struct{}

var Admin = &AdminHandler{}

// AdminLoginJWT — авторизация администратора через JWT
func (h *AdminHandler) AdminLoginJWT(c *gin.Context) {
	var req struct {
		Login    string `json:"login" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !repository.Repo.CheckAdmin(req.Login, req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	var role string
	err := database.DB.QueryRow(c.Request.Context(),
		`SELECT role FROM admin_users WHERE login = $1`, req.Login,
	).Scan(&role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get role"})
		return
	}

	token, err := utils.GenerateAdminJWT(req.Login, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"role":  role,
		"login": req.Login,
	})
}

// GetAllClients — список всех клиентов
func (h *AdminHandler) GetAllClients(c *gin.Context) {
	clients, err := repository.Repo.GetAllClients(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch clients"})
		return
	}
	c.JSON(http.StatusOK, clients)
}

// DeleteClient — удаление клиента по ID
func (h *AdminHandler) DeleteClient(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	err = repository.Repo.DeleteClient(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Delete failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Client deleted"})
}

// GetClientById — детальная информация о клиенте + его визиты
func (h *AdminHandler) GetClientById(c *gin.Context) {
	clientIDStr := c.Param("id")
	clientID, err := uuid.Parse(clientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID"})
		return
	}

	client, visits, err := repository.Repo.GetClientByID(c.Request.Context(), clientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch client"})
		return
	}
	if client == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Клиент не найден"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"client": client,
		"visits": visits,
	})
}

// GetAllBarbers — список активных мастеров
func (h *AdminHandler) GetAllBarbers(c *gin.Context) {
	barbers, err := repository.Repo.GetAllBarbers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch barbers: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, barbers)
}

// GetStats — расширенная статистика для админ-дашборда
func (h *AdminHandler) GetStats(c *gin.Context) {
	period := c.Query("period")
	startStr := c.Query("start")
	endStr := c.Query("end")

	var start, end time.Time
	var err error

	// Приоритет: если переданы start и end — используем их (custom период)
	if startStr != "" && endStr != "" {
		start, err = time.Parse("2006-01-02", startStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат даты start (ожидается YYYY-MM-DD)"})
			return
		}
		end, err = time.Parse("2006-01-02", endStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат даты end (ожидается YYYY-MM-DD)"})
			return
		}
		if end.Before(start) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Дата end не может быть раньше start"})
			return
		}
	} else {
		// Дефолтные периоды, если передан только period или ничего
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
			// если period пустой или неизвестный — берём последний месяц
			start = now.AddDate(0, -1, 0)
			end = now
		}
	}

	// Вызываем репозиторий с параметрами дат
	stats, err := repository.Repo.GetAdminStats(c.Request.Context(), start, end)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetClientBalance — баланс клиента
func (h *AdminHandler) GetClientBalance(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID"})
		return
	}

	balance, err := repository.Repo.GetClientBalance(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка базы данных"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"balance": balance,
	})
}

// GetClientVisits — список посещений клиента
func (h *AdminHandler) GetClientVisits(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID"})
		return
	}

	visits, err := repository.Repo.GetClientVisits(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения посещений"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"visits": visits})
}
