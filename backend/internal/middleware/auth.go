package middleware

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"go.mod/internal/utils"
)

func ClientAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header (expected Bearer Token)"})
			return
		}

		claims, err := utils.ParseClientJWT(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		c.Set("client_id_uuid", claims.ClientID)
		c.Set("phone", claims.Phone)

		c.Next()
	}
}

func AdminJWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		log.Printf("Admin middleware: Получен заголовок Authorization: %s", authHeader)

		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			log.Printf("Admin middleware: Неверный формат заголовка: %s", authHeader)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header (expected Bearer Token)"})
			return
		}

		tokenString := parts[1]
		log.Printf("Admin middleware: Токен для парсинга: %s", tokenString)

		claims, err := utils.ParseAdminJWT(tokenString)
		if err != nil {
			log.Printf("Admin middleware: Ошибка парсинга токена: %v", err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired admin token"})
			return
		}

		log.Printf("Admin middleware: Успешно распарсен токен, login: %s, role: %s", claims.Login, claims.Role)

		if claims.Role != "admin" && claims.Role != "manager" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Недостаточно прав"})
			return
		}

		c.Set("admin_login", claims.Login)
		c.Set("admin_role", claims.Role)

		c.Next()
	}
}
