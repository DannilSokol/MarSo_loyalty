package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.mod/internal/models"
	"go.mod/internal/repository"
	"go.mod/internal/utils"
)

type AuthHandler struct{}

var Auth = &AuthHandler{}

func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Phone string `json:"phone" binding:"required"`
		Ref   string `json:"ref,omitempty"` // опциональный реферальный код (uuid пригласившего)
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("BindJSON error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Login attempt with phone: %s, ref: %s", req.Phone, req.Ref)

	normalized, err := utils.NormalizePhone(req.Phone)
	if err != nil {
		log.Printf("Invalid phone format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат номера телефона: " + err.Error()})
		return
	}

	client, err := repository.Repo.GetClientByNormalizedPhone(c.Request.Context(), normalized)
	if err != nil {
		log.Printf("GetClientByNormalizedPhone error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if client == nil {
		log.Printf("Client not found, creating new with phone: %s (normalized: %s)", req.Phone, normalized)

		var referredBy *uuid.UUID
		if req.Ref != "" {
			id, parseErr := uuid.Parse(req.Ref)
			if parseErr == nil {
				referredBy = &id
				log.Printf("Referral code used: %s", req.Ref)
			} else {
				log.Printf("Invalid referral code: %s (%v)", req.Ref, parseErr)
			}
		}

		client, err = repository.Repo.CreateClient(c.Request.Context(), req.Phone, normalized, referredBy)
		if err != nil {
			log.Printf("CreateClient error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create client"})
			return
		}
	}

	token, err := utils.GenerateClientJWT(client.ID, client.Phone)
	if err != nil {
		log.Printf("GenerateClientJWT error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	log.Printf("Login successful for phone: %s, client_id: %s", req.Phone, client.ID.String())
	c.JSON(http.StatusOK, models.TokenResponse{Token: token})
}
