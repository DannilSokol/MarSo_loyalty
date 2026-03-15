package handlers

import (
	"github.com/google/uuid"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mod/internal/models"
	"go.mod/internal/repository"
	"go.mod/internal/utils"
)

type LoyaltyHandler struct{}

var Loyalty = &LoyaltyHandler{}

// GetLoyaltyCard — возвращает карту лояльности с QR-кодом
func (h *LoyaltyHandler) GetLoyaltyCard(c *gin.Context) {
	// Получаем client_id из токена
	clientID, exists := c.Get("client_id_uuid")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Client ID not found in token"})
		return
	}

	id, ok := clientID.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid client ID type"})
		return
	}

	// Получаем клиента по ID (чтобы взять phone)
	client, _, err := repository.Repo.GetClientByID(c.Request.Context(), id)
	if err != nil || client == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Client not found"})
		return
	}

	// Создаём одноразовый QR-токен в БД
	qrToken, err := repository.Repo.CreateQRToken(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create QR token"})
		return
	}

	// Генерируем QR-код как base64
	qrData, err := utils.GenerateQR(client.ID.String(), qrToken.Token)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate QR"})
		return
	}

	// Формируем ответ
	card := models.LoyaltyCard{
		ClientID: client.ID,
		Token:    qrToken.Token,
		Balance:  client.Balance,
		Level:    client.Level,
		QRData:   qrData,
	}

	c.JSON(http.StatusOK, card)
}

// ScanQR — сканирование QR-кода администратором
func (h *LoyaltyHandler) ScanQR(c *gin.Context) {
	var req struct {
		QRToken string `json:"qr_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Валидируем токен и получаем клиента
	client, err := repository.Repo.ValidateQRToken(c.Request.Context(), req.QRToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if client == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"valid":   false,
			"message": "QR-код недействителен или просрочен",
		})
		return
	}

	c.JSON(http.StatusOK, models.QRScanResponse{
		Valid:   true,
		Client:  client,
		Message: "QR-код успешно отсканирован",
		Token:   req.QRToken,
	})
}

// ValidateScan — оставляем для совместимости (старый метод)
func (h *LoyaltyHandler) ValidateScan(c *gin.Context) {
	var req struct {
		ClientID string `json:"client_id" binding:"required"`
		Token    string `json:"token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Простая проверка формата токена
	if len(req.Token) < 40 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token format"})
		return
	}

	// Проверка времени (RFC3339 часть токена)
	tokenTimeStr := req.Token[len(req.Token)-len(time.RFC3339):]
	_, err := time.Parse(time.RFC3339, tokenTimeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired token"})
		return
	}

	clientID, err := uuid.Parse(req.ClientID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid client ID"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"client_id": clientID.String(),
		"valid":     true,
		"message":   "Токен валиден (простая проверка)",
	})
}
