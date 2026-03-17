package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.mod/internal/repository"
)

type ReferHandler struct{}

var Refer = &ReferHandler{}

func (h *ReferHandler) GetReferralStats(c *gin.Context) {
	clientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid client ID"})
		return
	}
	stats, err := repository.Repo.GetReferralStats(c.Request.Context(), clientID)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, stats)
}
