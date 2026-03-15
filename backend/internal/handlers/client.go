package handlers

import (
	"go.mod/internal/models"
	"go.mod/internal/repository"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ClientHandler struct{}

var Client = &ClientHandler{}

func (h *ClientHandler) GetProfile(c *gin.Context) {
	phone := c.GetString("phone")

	client, err := repository.Repo.GetClientByPhone(c.Request.Context(), phone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if client == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Client not found"})
		return
	}

	c.JSON(http.StatusOK, client)
}

func (h *ClientHandler) UpdateProfile(c *gin.Context) {
	var req models.ClientUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Берём client_id как uuid.UUID напрямую из claims
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

	err := repository.Repo.UpdateClient(c.Request.Context(), id, req.Name, req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Update failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated"})
}
