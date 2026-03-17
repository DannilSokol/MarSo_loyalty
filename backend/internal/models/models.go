// Файл: internal/models/models.go — ПОЛНЫЙ ФАЙЛ (убрана вся логика барберов/мастеров)

package models

import (
	"time"

	"github.com/google/uuid"
)

// Client — основная модель клиента
type Client struct {
	ID              uuid.UUID `json:"id"`
	Phone           string    `json:"phone"`
	NormalizedPhone string    `json:"normalized_phone,omitempty"`
	PasswordHash    string    `json:"-"`
	Name            string    `json:"name,omitempty"`
	Email           string    `json:"email,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at,omitempty"`
	TotalSpent      float64   `json:"total_spent"`
	Balance         float64   `json:"balance"`
	Level           string    `json:"level"` // bronze, silver, gold
	Status          string    `json:"status,omitempty"`
	LastVisitAt     time.Time `json:"last_visit_at,omitempty"`
	ReferredBy      uuid.UUID `json:"referred_by,omitempty"`
}

// Visit — запись о посещении (без BarberID)
type Visit struct {
	ID          uuid.UUID `json:"id"`
	ClientID    uuid.UUID `json:"client_id"`
	Amount      float64   `json:"amount"`
	BonusAmount float64   `json:"bonus_amount"`
	Note        string    `json:"note,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

// Admin — администратор
type Admin struct {
	ID          int       `json:"-"`
	Login       string    `json:"login"`
	Role        string    `json:"role"`
	IsActive    bool      `json:"-"`
	LastLoginAt time.Time `json:"-"`
}

// TokenResponse — ответ с JWT
type TokenResponse struct {
	Token string `json:"token"`
}

// ClientUpdate — обновление профиля
type ClientUpdate struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

// LoyaltyCard — карта лояльности с QR
type LoyaltyCard struct {
	ClientID uuid.UUID `json:"client_id"`
	Token    string    `json:"token"`
	Balance  float64   `json:"balance"`
	Level    string    `json:"level"`
	QRData   string    `json:"qr_data"`
}

// Transaction — операция с бонусами
type Transaction struct {
	ID          uuid.UUID `json:"id"`
	ClientID    uuid.UUID `json:"client_id"`
	Type        string    `json:"type"`
	Amount      float64   `json:"amount"`
	Description string    `json:"description,omitempty"`
	VisitID     uuid.UUID `json:"visit_id,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

// QRToken — токен для QR-кода
type QRToken struct {
	ID        uuid.UUID `json:"id"`
	ClientID  uuid.UUID `json:"client_id"`
	Token     string    `json:"token"`
	Used      bool      `json:"used"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

// QRScanResponse — ответ после сканирования QR
type QRScanResponse struct {
	Valid   bool    `json:"valid"`
	Client  *Client `json:"client,omitempty"`
	Message string  `json:"message,omitempty"`
	Token   string  `json:"token,omitempty"`
}

// VisitCreateWithBonus — запрос на визит с бонусами
type VisitCreateWithBonus struct {
	Phone       string  `json:"phone" binding:"required"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	UseBonus    bool    `json:"use_bonus"`
	BonusAmount float64 `json:"bonus_amount" binding:"min=0"`
	Note        string  `json:"note,omitempty"`
}

// AdminStats — расширенная статистика для админ-дашборда
// Убрано поле TopBarbers полностью
type AdminStats struct {
	Revenue struct {
		Today       float64 `json:"today"`
		ThisWeek    float64 `json:"this_week"`
		ThisMonth   float64 `json:"this_month"`
		Total       float64 `json:"total"`
		GrowthWeek  float64 `json:"growth_week"`  // % к предыдущей неделе
		GrowthMonth float64 `json:"growth_month"` // % к предыдущему месяцу
	} `json:"revenue"`

	Visits struct {
		Today        int     `json:"today"`
		ThisWeek     int     `json:"this_week"`
		ThisMonth    int     `json:"this_month"`
		AverageCheck float64 `json:"average_check"`
	} `json:"visits"`

	Clients struct {
		Total            int     `json:"total"`
		NewThisMonth     int     `json:"new_this_month"`
		ActiveLast30Days int     `json:"active_last_30_days"`
		AverageLTV       float64 `json:"avg_ltv"`
		ChurnRate30Days  float64 `json:"churn_rate_30_days"` // %
	} `json:"clients"`

	Loyalty struct {
		TotalBalance      float64 `json:"total_balance"`
		AccruedThisMonth  float64 `json:"accrued_this_month"`
		RedeemedThisMonth float64 `json:"redeemed_this_month"`
		ExpiredThisMonth  float64 `json:"expired_this_month"`
	} `json:"loyalty"`

	BreakdownByLevel struct {
		Bronze struct {
			Clients int     `json:"clients"`
			Revenue float64 `json:"revenue"`
		} `json:"bronze"`
		Silver struct {
			Clients int     `json:"clients"`
			Revenue float64 `json:"revenue"`
		} `json:"silver"`
		Gold struct {
			Clients int     `json:"clients"`
			Revenue float64 `json:"revenue"`
		} `json:"gold"`
	} `json:"breakdown_by_level"`

	TopClients []struct {
		Phone      string  `json:"phone"`
		Name       string  `json:"name,omitempty"`
		Level      string  `json:"level"`
		TotalSpent float64 `json:"total_spent"`
		Visits     int     `json:"visits"`
		LastVisit  string  `json:"last_visit"` // YYYY-MM-DD
	} `json:"top_clients"`
}
type ReferralStats struct {
	Count  int     `json:"count"`  // Кол-во приглашённых
	Earned float64 `json:"earned"` // Сумма заработанных бонусов через рефералов
}
