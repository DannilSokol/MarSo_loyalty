package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	_ "github.com/google/uuid"
	"go.mod/internal/models"
	"go.mod/internal/repository"
)

type VisitHandler struct{}

var Visit = &VisitHandler{}

// CreateVisit — создание посещения без бонусов (теперь без barber_id)
func (h *VisitHandler) CreateVisit(c *gin.Context) {
	var req struct {
		Phone  string  `json:"phone" binding:"required"`
		Amount float64 `json:"amount" binding:"required,gt=0"`
		Note   string  `json:"note,omitempty"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client, err := repository.Repo.GetClientByPhone(c.Request.Context(), req.Phone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка базы данных"})
		return
	}
	if client == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Клиент не найден"})
		return
	}

	// Вызов без barberID
	visit, err := repository.Repo.CreateVisit(c.Request.Context(), client.ID, req.Amount, 0, req.Note)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать посещение: " + err.Error()})
		return
	}

	updatedClient, _, err := repository.Repo.GetClientByID(c.Request.Context(), client.ID)
	if err != nil {
		updatedClient = client // fallback
	}

	c.JSON(http.StatusCreated, gin.H{
		"visit":                visit,
		"message":              "Посещение успешно создано",
		"client_balance_after": updatedClient.Balance,
		"client":               updatedClient,
	})
}

// CreateVisitWithBonus — создание с бонусами (теперь без barber_id)
func (h *VisitHandler) CreateVisitWithBonus(c *gin.Context) {
	var req models.VisitCreateWithBonus
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client, err := repository.Repo.GetClientByPhone(c.Request.Context(), req.Phone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка базы данных"})
		return
	}
	if client == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Клиент не найден"})
		return
	}

	// Валидация
	if req.UseBonus && req.BonusAmount > req.Amount {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Сумма списания бонусов не может превышать сумму чека"})
		return
	}
	if req.UseBonus && req.BonusAmount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Сумма списания бонусов должна быть больше 0"})
		return
	}
	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Сумма чека должна быть больше 0"})
		return
	}
	if req.UseBonus && req.BonusAmount > 0 && client.Balance < req.BonusAmount {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":     "Недостаточно бонусов",
			"balance":   client.Balance,
			"requested": req.BonusAmount,
		})
		return
	}

	// Вызов без barberID
	visit, err := repository.Repo.CreateVisitWithBonus(
		c.Request.Context(),
		client.ID,
		req.Amount,
		req.UseBonus,
		req.BonusAmount,
		req.Note,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать посещение: " + err.Error()})
		return
	}

	updatedClient, _, err := repository.Repo.GetClientByID(c.Request.Context(), client.ID)
	if err != nil {
		updatedClient = client // fallback
	}

	c.JSON(http.StatusCreated, gin.H{
		"visit":                visit,
		"message":              "Посещение успешно создано",
		"client_balance_after": updatedClient.Balance,
		"client":               updatedClient,
	})
}
