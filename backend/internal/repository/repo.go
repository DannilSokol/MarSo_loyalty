package repository

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"go.mod/internal/database"
	"go.mod/internal/models"
	"go.mod/internal/utils"
	"golang.org/x/crypto/bcrypt"
)

type Repository struct{}

var Repo = &Repository{}

// ─────────────────────────────────────────────────────────────────────────────
// Клиенты
// ─────────────────────────────────────────────────────────────────────────────

func (r *Repository) GetClientByNormalizedPhone(ctx context.Context, normPhone string) (*models.Client, error) {
	var client models.Client
	var name, email *string
	var referredBy *uuid.UUID

	err := database.DB.QueryRow(ctx,
		`SELECT id, phone, normalized_phone, name, email, created_at, total_spent, balance, level, referred_by
		 FROM clients WHERE normalized_phone = $1`,
		normPhone,
	).Scan(
		&client.ID, &client.Phone, &client.NormalizedPhone, &name, &email,
		&client.CreatedAt, &client.TotalSpent, &client.Balance, &client.Level, &referredBy,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		log.Printf("GetClientByNormalizedPhone error: %v", err)
		return nil, err
	}

	if name != nil {
		client.Name = *name
	}
	if email != nil {
		client.Email = *email
	}
	if referredBy != nil {
		client.ReferredBy = *referredBy
	}

	return &client, nil
}

func (r *Repository) CreateClient(ctx context.Context, rawPhone, normPhone string, referredBy *uuid.UUID) (*models.Client, error) {
	var client models.Client
	var name, email *string
	var returnedReferredBy *uuid.UUID

	query := `INSERT INTO clients (phone, normalized_phone, level`
	args := []interface{}{rawPhone, normPhone}
	returning := `RETURNING id, phone, normalized_phone, name, email, created_at, total_spent, balance, level, referred_by`

	if referredBy != nil {
		query += `, referred_by`
		args = append(args, *referredBy)
	}

	query += `) VALUES ($1, $2, 'bronze'`

	if referredBy != nil {
		query += `, $3`
	}

	query += `) ` + returning

	err := database.DB.QueryRow(ctx, query, args...).Scan(
		&client.ID, &client.Phone, &client.NormalizedPhone, &name, &email,
		&client.CreatedAt, &client.TotalSpent, &client.Balance, &client.Level, &returnedReferredBy,
	)
	if err != nil {
		log.Printf("CreateClient error: %v", err)
		return nil, err
	}

	if name != nil {
		client.Name = *name
	}
	if email != nil {
		client.Email = *email
	}
	if returnedReferredBy != nil {
		client.ReferredBy = *returnedReferredBy
	}

	log.Printf("Created new client: ID=%s, Phone=%s (normalized=%s), referred_by=%v", client.ID, rawPhone, normPhone, referredBy)
	return &client, nil
}

func (r *Repository) GetClientByPhone(ctx context.Context, phone string) (*models.Client, error) {
	normalized, err := utils.NormalizePhone(phone)
	if err != nil {
		return nil, err
	}
	return r.GetClientByNormalizedPhone(ctx, normalized)
}

func (r *Repository) GetClientByID(ctx context.Context, id uuid.UUID) (*models.Client, []models.Visit, error) {
	var client models.Client
	var name, email *string
	var referredBy *uuid.UUID

	err := database.DB.QueryRow(ctx,
		`SELECT id, phone, normalized_phone, name, email, created_at, total_spent, balance, level, referred_by
		 FROM clients WHERE id = $1`,
		id,
	).Scan(
		&client.ID, &client.Phone, &client.NormalizedPhone, &name, &email,
		&client.CreatedAt, &client.TotalSpent, &client.Balance, &client.Level, &referredBy,
	)
	if err == pgx.ErrNoRows {
		return nil, nil, nil
	}
	if err != nil {
		log.Printf("GetClientByID error: %v", err)
		return nil, nil, err
	}

	if name != nil {
		client.Name = *name
	}
	if email != nil {
		client.Email = *email
	}
	if referredBy != nil {
		client.ReferredBy = *referredBy
	}

	// Визиты клиента (без barber_id)
	rows, err := database.DB.Query(ctx,
		`SELECT id, client_id, amount, bonus_amount, note, created_at
		 FROM visits WHERE client_id = $1 ORDER BY created_at DESC`,
		id,
	)
	if err != nil {
		log.Printf("GetClientVisits error: %v", err)
		return &client, nil, err
	}
	defer rows.Close()

	var visits []models.Visit
	for rows.Next() {
		var v models.Visit
		err := rows.Scan(&v.ID, &v.ClientID, &v.Amount, &v.BonusAmount, &v.Note, &v.CreatedAt)
		if err != nil {
			log.Printf("Scan visit error: %v", err)
			return &client, nil, err
		}
		visits = append(visits, v)
	}

	return &client, visits, nil
}

func (r *Repository) GetAllClients(ctx context.Context) ([]models.Client, error) {
	rows, err := database.DB.Query(ctx,
		`SELECT id, phone, normalized_phone, name, email, created_at, total_spent, balance, level
		 FROM clients ORDER BY created_at DESC`,
	)
	if err != nil {
		log.Printf("GetAllClients query error: %v", err)
		return nil, err
	}
	defer rows.Close()

	var clients []models.Client
	for rows.Next() {
		var c models.Client
		var name, email *string
		err := rows.Scan(&c.ID, &c.Phone, &c.NormalizedPhone, &name, &email,
			&c.CreatedAt, &c.TotalSpent, &c.Balance, &c.Level)
		if err != nil {
			log.Printf("GetAllClients scan error: %v", err)
			return nil, err
		}
		if name != nil {
			c.Name = *name
		}
		if email != nil {
			c.Email = *email
		}
		clients = append(clients, c)
	}
	return clients, nil
}

func (r *Repository) DeleteClient(ctx context.Context, id uuid.UUID) error {
	_, err := database.DB.Exec(ctx, `DELETE FROM clients WHERE id = $1`, id)
	if err != nil {
		log.Printf("DeleteClient error: %v", err)
	}
	return err
}

func (r *Repository) UpdateClient(ctx context.Context, id uuid.UUID, name, email string) error {
	_, err := database.DB.Exec(ctx,
		`UPDATE clients SET name = $1, email = $2, updated_at = NOW() WHERE id = $3`,
		name, email, id,
	)
	if err != nil {
		log.Printf("UpdateClient error: %v", err)
	}
	return err
}

// ─────────────────────────────────────────────────────────────────────────────
// Админы и уровни
// ─────────────────────────────────────────────────────────────────────────────

func (r *Repository) CheckAdmin(login, password string) bool {
	var hash string
	err := database.DB.QueryRow(context.Background(),
		`SELECT password_hash FROM admin_users WHERE login = $1 AND is_active = TRUE`,
		login,
	).Scan(&hash)
	if err != nil {
		log.Printf("CheckAdmin query error: %v", err)
		return false
	}
	err = bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		log.Printf("CheckAdmin password mismatch: %v", err)
		return false
	}
	return true
}

func (r *Repository) GetPercent(clientID uuid.UUID) float64 {
	var total float64
	err := database.DB.QueryRow(context.Background(),
		`SELECT total_spent FROM clients WHERE id = $1`, clientID,
	).Scan(&total)
	if err != nil {
		log.Printf("GetPercent error: %v", err)
		return 3.0
	}

	if total >= 90000 {
		return 10.0
	}
	if total >= 7000 {
		return 5.0
	}
	return 3.0
}

func (r *Repository) GetLevel(totalSpent float64) string {
	if totalSpent >= 90000 {
		return "gold"
	}
	if totalSpent >= 7000 {
		return "silver"
	}
	return "bronze"
}

func (r *Repository) CalculateLevel(ctx context.Context, clientID uuid.UUID) (string, error) {
	var total float64

	err := database.DB.QueryRow(ctx,
		`SELECT COALESCE(total_spent, 0) FROM clients WHERE id = $1`,
		clientID,
	).Scan(&total)
	if err != nil {
		log.Printf("CalculateLevel error: %v", err)
		return "bronze", err
	}

	if total >= 90000 {
		return "gold", nil
	}
	if total >= 7000 {
		return "silver", nil
	}
	return "bronze", nil
}

func (r *Repository) UpdateClientLevel(ctx context.Context, clientID uuid.UUID) error {
	newLevel, err := r.CalculateLevel(ctx, clientID)
	if err != nil {
		return err
	}

	_, err = database.DB.Exec(ctx,
		`UPDATE clients SET level = $1, updated_at = NOW() WHERE id = $2`,
		newLevel, clientID,
	)
	if err != nil {
		log.Printf("UpdateClientLevel error: %v", err)
		return err
	}

	log.Printf("Client %s level updated to %s", clientID, newLevel)
	return nil
}

func (r *Repository) DowngradeInactiveClients(ctx context.Context) error {
	sixMonthsAgo := time.Now().AddDate(0, -6, 0)

	result, err := database.DB.Exec(ctx,
		`UPDATE clients
		 SET level = CASE
		     WHEN level = 'gold' AND last_visit_at < $1 THEN 'silver'
		     WHEN level = 'silver' AND last_visit_at < $1 THEN 'bronze'
		     ELSE level
		 END,
		 updated_at = NOW()
		 WHERE last_visit_at < $1 AND last_visit_at IS NOT NULL`,
		sixMonthsAgo,
	)
	if err != nil {
		log.Printf("DowngradeInactiveClients error: %v", err)
		return err
	}

	rowsAffected := result.RowsAffected()
	log.Printf("Downgraded %d inactive clients", rowsAffected)
	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// Транзакции и бонусы
// ─────────────────────────────────────────────────────────────────────────────

func (r *Repository) createTransactionInTx(ctx context.Context,
	tx pgx.Tx, clientID uuid.UUID, transType string,
	amount float64, description string, visitID uuid.UUID) error {

	_, err := tx.Exec(ctx,
		`INSERT INTO transactions (client_id, type, amount, description, visit_id)
		 VALUES ($1, $2, $3, $4, $5)`,
		clientID, transType, amount, description, visitID,
	)
	if err != nil {
		log.Printf("createTransactionInTx error: %v", err)
		return err
	}
	return nil
}

func (r *Repository) BurnInactiveBonuses(ctx context.Context, tx pgx.Tx, clientID uuid.UUID) (float64, error) {
	var lastVisitAt *time.Time
	var currentBalance float64

	err := tx.QueryRow(ctx,
		`SELECT last_visit_at, balance FROM clients WHERE id = $1 FOR UPDATE`,
		clientID,
	).Scan(&lastVisitAt, &currentBalance)
	if err != nil {
		log.Printf("BurnInactiveBonuses select error for %s: %v", clientID, err)
		return 0, err
	}

	if currentBalance <= 0 {
		return 0, nil
	}

	ninetyDaysAgo := time.Now().AddDate(0, 0, -180)

	if lastVisitAt == nil || lastVisitAt.Before(ninetyDaysAgo) {
		_, err = tx.Exec(ctx,
			`UPDATE clients SET balance = 0, updated_at = NOW() WHERE id = $1`,
			clientID,
		)
		if err != nil {
			log.Printf("BurnInactiveBonuses update balance error for %s: %v", clientID, err)
			return 0, err
		}

		_, err = tx.Exec(ctx,
			`INSERT INTO transactions (client_id, type, amount, description, created_at)
			 VALUES ($1, 'expiry', $2, 'Сгорание всех бонусов за неактивность более 180 дней', NOW())`,
			clientID, -currentBalance,
		)
		if err != nil {
			log.Printf("BurnInactiveBonuses insert transaction error for %s: %v", clientID, err)
			return 0, err
		}

		log.Printf("Burned %.2f bonuses for inactive client %s (no visit >180 days or never visited)", currentBalance, clientID)
		return currentBalance, nil
	}

	return 0, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// Визиты — без barber_id
// ─────────────────────────────────────────────────────────────────────────────

func (r *Repository) CreateVisit(ctx context.Context, clientID uuid.UUID, amount float64, bonusAmount float64, note string) (*models.Visit, error) {
	return r.CreateVisitWithBonus(ctx, clientID, amount, false, 0, note)
}

func (r *Repository) CreateVisitWithBonus(ctx context.Context,
	clientID uuid.UUID, amount float64, useBonus bool,
	bonusAmount float64, note string) (*models.Visit, error) {

	var visit models.Visit

	tx, err := database.DB.Begin(ctx)
	if err != nil {
		log.Printf("CreateVisitWithBonus begin tx error: %v", err)
		return nil, err
	}
	defer tx.Rollback(ctx)

	burned, err := r.BurnInactiveBonuses(ctx, tx, clientID)
	if err != nil {
		return nil, err
	}

	var balanceBefore float64
	_ = tx.QueryRow(ctx, `SELECT balance FROM clients WHERE id = $1`, clientID).Scan(&balanceBefore)

	requestedSpend := useBonus && bonusAmount > 0.0
	spentBonus := 0.0

	// INSERT без barber_id
	err = tx.QueryRow(ctx,
		`INSERT INTO visits (client_id, amount, bonus_amount, note)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, client_id, amount, bonus_amount, created_at, note`,
		clientID, amount, bonusAmount, note,
	).Scan(&visit.ID, &visit.ClientID, &visit.Amount, &visit.BonusAmount, &visit.CreatedAt, &visit.Note)
	if err != nil {
		log.Printf("CreateVisitWithBonus insert visit error: %v", err)
		return nil, err
	}

	if requestedSpend {
		if bonusAmount > amount {
			tx.Rollback(ctx)
			return nil, errors.New("Сумма списания бонусов не может превышать сумму чека")
		}

		spent, err := r.spendBonusesInTx(ctx, tx, clientID, bonusAmount, visit.ID)
		if err != nil {
			log.Printf("Spend bonuses error: %v", err)
			return nil, err
		}
		spentBonus = spent

		if spentBonus < 1.0 {
			tx.Rollback(ctx)
			return nil, errors.New("Недостаточно бонусов")
		}
	}

	var bonus float64 = 0.0
	realSpent := amount - spentBonus

	if !requestedSpend {
		percent := r.GetPercent(clientID)
		bonus = amount * percent / 100

		if bonus > 0 {
			_, err = tx.Exec(ctx,
				`UPDATE clients
				 SET balance = balance + $1,
				     total_spent = total_spent + $2,
				     last_visit_at = NOW()
				 WHERE id = $3`,
				bonus, realSpent, clientID,
			)
			if err != nil {
				log.Printf("CreateVisitWithBonus accrual update error: %v", err)
				return nil, err
			}

			err = r.createTransactionInTx(ctx, tx, clientID,
				"accrual", bonus,
				"Начисление бонусов за посещение", visit.ID)
			if err != nil {
				log.Printf("Accrual transaction error: %v", err)
				return nil, err
			}

			log.Printf("Accrued %.2f bonus (no spend requested), total_spent += %.2f", bonus, realSpent)
		}
	} else {
		_, err = tx.Exec(ctx,
			`UPDATE clients
			 SET total_spent = total_spent + $1,
			     last_visit_at = NOW()
			 WHERE id = $2`,
			realSpent, clientID,
		)
		if err != nil {
			log.Printf("CreateVisitWithBonus update total_spent error: %v", err)
			return nil, err
		}

		log.Printf("No accrual (spend requested), total_spent += %.2f (real paid)", realSpent)
	}

	// Проверка на первый визит и рефералку
	var visitCount int
	err = tx.QueryRow(ctx,
		`SELECT COUNT(*) FROM visits WHERE client_id = $1 AND id != $2`,
		clientID, visit.ID,
	).Scan(&visitCount)
	if err == nil && visitCount == 0 {
		r.accrueReferralBonus(ctx, tx, clientID, visit.ID)
	}

	if err := tx.Commit(ctx); err != nil {
		log.Printf("CreateVisitWithBonus commit error: %v", err)
		return nil, err
	}

	err = r.UpdateClientLevel(ctx, clientID)
	if err != nil {
		log.Printf("UpdateClientLevel error: %v", err)
	}

	log.Printf("Visit committed: client %s | amount %.2f | real_paid %.2f | accrued %.2f | spent %.2f | balance before %.2f → after %.2f | burned %.2f",
		clientID, amount, realSpent, bonus, spentBonus, balanceBefore, balanceBefore-spentBonus+bonus, burned)

	return &visit, nil
}

func (r *Repository) spendBonusesInTx(ctx context.Context, tx pgx.Tx, clientID uuid.UUID, maxSpend float64, visitID uuid.UUID) (float64, error) {
	var currentBalance float64

	err := tx.QueryRow(ctx,
		`SELECT balance FROM clients WHERE id = $1 FOR UPDATE`,
		clientID,
	).Scan(&currentBalance)
	if err != nil {
		log.Printf("spendBonusesInTx: failed to lock client balance: %v", err)
		return 0, err
	}

	if currentBalance <= 0 {
		log.Printf("spendBonusesInTx: zero or negative balance for client %s", clientID)
		return 0, nil
	}

	toSpend := min(maxSpend, currentBalance)
	if toSpend < 1.0 {
		return 0, nil
	}

	_, err = tx.Exec(ctx,
		`UPDATE clients SET balance = balance - $1, updated_at = NOW() WHERE id = $2`,
		toSpend, clientID,
	)
	if err != nil {
		log.Printf("spendBonusesInTx: failed to update balance: %v", err)
		return 0, err
	}

	_, err = tx.Exec(ctx,
		`INSERT INTO transactions (client_id, type, amount, description, visit_id, created_at)
		 VALUES ($1, 'redemption', $2, 'Списание бонусов при оплате визита', $3, NOW())`,
		clientID, -toSpend, visitID,
	)
	if err != nil {
		log.Printf("spendBonusesInTx: failed to insert redemption transaction: %v", err)
		return 0, err
	}

	log.Printf("Spent %.2f bonuses for client %s (from total balance %.2f)", toSpend, clientID, currentBalance)
	return toSpend, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// Реферальная система
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Вспомогательные
// ─────────────────────────────────────────────────────────────────────────────

func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

func (r *Repository) GetClientVisits(ctx context.Context, clientID uuid.UUID) ([]models.Visit, error) {
	rows, err := database.DB.Query(ctx,
		`SELECT id, client_id, amount, bonus_amount, note, created_at
		 FROM visits WHERE client_id = $1 ORDER BY created_at DESC`,
		clientID,
	)
	if err != nil {
		log.Printf("GetClientVisits error: %v", err)
		return nil, err
	}
	defer rows.Close()

	var visits []models.Visit
	for rows.Next() {
		var v models.Visit
		err := rows.Scan(&v.ID, &v.ClientID, &v.Amount, &v.BonusAmount, &v.Note, &v.CreatedAt)
		if err != nil {
			log.Printf("Scan visit error: %v", err)
			return nil, err
		}
		visits = append(visits, v)
	}
	return visits, nil
}

func (r *Repository) GetClientBalance(ctx context.Context, clientID uuid.UUID) (float64, error) {
	var balance float64
	err := database.DB.QueryRow(ctx,
		`SELECT balance FROM clients WHERE id = $1`,
		clientID,
	).Scan(&balance)
	if err != nil {
		log.Printf("GetClientBalance error: %v", err)
		return 0, err
	}
	return balance, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// QR-токены
// ─────────────────────────────────────────────────────────────────────────────

func (r *Repository) CreateQRToken(ctx context.Context, clientID uuid.UUID) (*models.QRToken, error) {
	token := uuid.New().String() + "-" + time.Now().Format(time.RFC3339)
	expiresAt := time.Now().Add(5 * time.Minute)

	var qrToken models.QRToken
	err := database.DB.QueryRow(ctx,
		`INSERT INTO qr_tokens (client_id, token, expires_at)
		 VALUES ($1, $2, $3)
		 RETURNING id, client_id, token, used, expires_at, created_at`,
		clientID, token, expiresAt,
	).Scan(&qrToken.ID, &qrToken.ClientID, &qrToken.Token, &qrToken.Used,
		&qrToken.ExpiresAt, &qrToken.CreatedAt)
	if err != nil {
		log.Printf("CreateQRToken error: %v", err)
		return nil, err
	}

	return &qrToken, nil
}

func (r *Repository) ValidateQRToken(ctx context.Context, token string) (*models.Client, error) {
	var client models.Client
	var clientID uuid.UUID
	var name, email *string

	err := database.DB.QueryRow(ctx,
		`UPDATE qr_tokens
		 SET used = TRUE
		 WHERE token = $1
		   AND used = FALSE
		   AND expires_at > NOW()
		 RETURNING client_id`,
		token,
	).Scan(&clientID)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		log.Printf("ValidateQRToken update error: %v", err)
		return nil, err
	}

	err = database.DB.QueryRow(ctx,
		`SELECT id, phone, normalized_phone, name, email, created_at, total_spent, balance, level
		 FROM clients WHERE id = $1`,
		clientID,
	).Scan(&client.ID, &client.Phone, &client.NormalizedPhone, &name, &email,
		&client.CreatedAt, &client.TotalSpent, &client.Balance, &client.Level)
	if err != nil {
		log.Printf("ValidateQRToken get client error: %v", err)
		return nil, err
	}

	if name != nil {
		client.Name = *name
	}
	if email != nil {
		client.Email = *email
	}

	return &client, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// Статистика для дашборда — без мастеров
// ─────────────────────────────────────────────────────────────────────────────

func (r *Repository) GetAdminStats(ctx context.Context, start, end time.Time) (*models.AdminStats, error) {
	stats := &models.AdminStats{}

	// Нормализация дат
	if end.IsZero() {
		end = time.Now()
	}
	if start.IsZero() || start.After(end) {
		return nil, errors.New("некорректный диапазон дат")
	}

	// Revenue
	err := database.DB.QueryRow(ctx,
		`SELECT
			COALESCE(SUM(amount) FILTER (WHERE created_at >= $1 AND created_at <= $2), 0) AS period_total,
			COALESCE(SUM(amount), 0) AS total
		 FROM visits`,
		start, end,
	).Scan(
		&stats.Revenue.ThisMonth,
		&stats.Revenue.Total,
	)
	if err != nil {
		log.Printf("GetAdminStats revenue error: %v", err)
		return nil, err
	}

	// Growth (предыдущий аналогичный период)
	duration := end.Sub(start)
	prevStart := start.Add(-duration)
	prevEnd := start
	var prevPeriod float64
	err = database.DB.QueryRow(ctx,
		`SELECT COALESCE(SUM(amount), 0)
		 FROM visits
		 WHERE created_at >= $1 AND created_at < $2`,
		prevStart, prevEnd,
	).Scan(&prevPeriod)
	if err != nil {
		log.Printf("GetAdminStats growth error: %v", err)
		return nil, err
	}
	if prevPeriod > 0 {
		stats.Revenue.GrowthMonth = ((stats.Revenue.ThisMonth - prevPeriod) / prevPeriod) * 100
	}

	// Visits
	err = database.DB.QueryRow(ctx,
		`SELECT
			COUNT(*) FILTER (WHERE created_at >= $1 AND created_at <= $2) AS period_count,
			AVG(amount) FILTER (WHERE created_at >= $1 AND created_at <= $2) AS avg_check
		 FROM visits`,
		start, end,
	).Scan(
		&stats.Visits.ThisMonth,
		&stats.Visits.AverageCheck,
	)
	if err != nil {
		log.Printf("GetAdminStats visits error: %v", err)
		return nil, err
	}

	// Clients
	err = database.DB.QueryRow(ctx,
		`SELECT
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE created_at >= $1 AND created_at <= $2) AS new_in_period,
			(SELECT COUNT(DISTINCT v.client_id)
			 FROM visits v
			 WHERE v.created_at >= $1 AND v.created_at <= $2) AS active_in_period,
			AVG(total_spent) AS avg_ltv
		 FROM clients`,
		start, end,
	).Scan(
		&stats.Clients.Total,
		&stats.Clients.NewThisMonth,
		&stats.Clients.ActiveLast30Days,
		&stats.Clients.AverageLTV,
	)
	if err != nil {
		log.Printf("GetAdminStats clients error: %v", err)
		return nil, err
	}

	// Churn rate
	inactive := stats.Clients.Total - stats.Clients.ActiveLast30Days
	if stats.Clients.Total > 0 {
		stats.Clients.ChurnRate30Days = (float64(inactive) / float64(stats.Clients.Total)) * 100
	}

	// Loyalty
	err = database.DB.QueryRow(ctx,
		`SELECT
			COALESCE(SUM(c.balance), 0) AS total_balance,
			COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'accrual' AND t.created_at >= $1 AND t.created_at <= $2), 0) AS accrued,
			COALESCE(SUM(ABS(t.amount)) FILTER (WHERE t.type = 'redemption' AND t.created_at >= $1 AND t.created_at <= $2), 0) AS redeemed,
			COALESCE(SUM(ABS(t.amount)) FILTER (WHERE t.type = 'expiry' AND t.created_at >= $1 AND t.created_at <= $2), 0) AS expired
		 FROM clients c
		 LEFT JOIN transactions t ON c.id = t.client_id`,
		start, end,
	).Scan(
		&stats.Loyalty.TotalBalance,
		&stats.Loyalty.AccruedThisMonth,
		&stats.Loyalty.RedeemedThisMonth,
		&stats.Loyalty.ExpiredThisMonth,
	)
	if err != nil {
		log.Printf("GetAdminStats loyalty error: %v", err)
		return nil, err
	}

	// Breakdown by level
	rows, err := database.DB.Query(ctx,
		`SELECT level, COUNT(*), COALESCE(SUM(total_spent), 0)
		 FROM clients GROUP BY level`,
	)
	if err != nil {
		log.Printf("GetAdminStats breakdown error: %v", err)
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var level string
		var count int
		var revenue float64
		rows.Scan(&level, &count, &revenue)
		switch level {
		case "bronze":
			stats.BreakdownByLevel.Bronze.Clients = count
			stats.BreakdownByLevel.Bronze.Revenue = revenue
		case "silver":
			stats.BreakdownByLevel.Silver.Clients = count
			stats.BreakdownByLevel.Silver.Revenue = revenue
		case "gold":
			stats.BreakdownByLevel.Gold.Clients = count
			stats.BreakdownByLevel.Gold.Revenue = revenue
		}
	}

	// Top clients (по расходам, за период)
	topClientRows, err := database.DB.Query(ctx,
		`SELECT
			c.phone,
			c.name,
			c.level,
			c.total_spent,
			(SELECT COUNT(*) FROM visits v WHERE v.client_id = c.id AND v.created_at >= $1 AND v.created_at <= $2) AS visits,
			(SELECT MAX(v.created_at)::text FROM visits v WHERE v.client_id = c.id AND v.created_at >= $1 AND v.created_at <= $2) AS last_visit
		 FROM clients c
		 ORDER BY c.total_spent DESC
		 LIMIT 5`,
		start, end,
	)
	if err != nil {
		log.Printf("GetAdminStats top clients error: %v", err)
		return nil, err
	}
	defer topClientRows.Close()

	for topClientRows.Next() {
		var tc struct {
			Phone      string  `json:"phone"`
			Name       string  `json:"name,omitempty"`
			Level      string  `json:"level"`
			TotalSpent float64 `json:"total_spent"`
			Visits     int     `json:"visits"`
			LastVisit  string  `json:"last_visit"`
		}
		topClientRows.Scan(&tc.Phone, &tc.Name, &tc.Level, &tc.TotalSpent, &tc.Visits, &tc.LastVisit)
		if tc.LastVisit == "" {
			tc.LastVisit = "—"
		}
		stats.TopClients = append(stats.TopClients, tc)
	}

	// Топ-мастера удалены полностью — поле TopBarbers не заполняется
	// Если в модели AdminStats есть поле TopBarbers — оно останется пустым массивом или nil

	return stats, nil
}
func (r *Repository) accrueReferralBonus(ctx context.Context, tx pgx.Tx, clientID uuid.UUID, visitID uuid.UUID) {
	var referrerID uuid.UUID
	err := tx.QueryRow(ctx,
		`SELECT referred_by FROM clients WHERE id = $1 AND referred_by IS NOT NULL`,
		clientID,
	).Scan(&referrerID)
	if err != nil || referrerID == uuid.Nil {
		return
	}

	const bonusAmount = 300.0

	// Начисляем пригласившему и обновляем referral_earned_total
	_, err = tx.Exec(ctx,
		`UPDATE clients 
		 SET balance = balance + $1, 
		     referral_earned_total = referral_earned_total + $1, 
		     updated_at = NOW() 
		 WHERE id = $2`,
		bonusAmount, referrerID,
	)
	if err != nil {
		log.Printf("Referral to referrer failed: %v", err)
		return
	}
	r.createTransactionInTx(ctx, tx, referrerID, "accrual", bonusAmount, "Реферальный бонус за друга", visitID)

	// Начисляем новому клиенту
	_, err = tx.Exec(ctx,
		`UPDATE clients SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
		bonusAmount, clientID,
	)
	if err != nil {
		log.Printf("Referral to new client failed: %v", err)
		return
	}
	r.createTransactionInTx(ctx, tx, clientID, "accrual", bonusAmount, "Реферальный бонус за первый визит", visitID)

	log.Printf("Referral bonus 300₽ each: new=%s ← referrer=%s", clientID, referrerID)
}

// Новый метод для получения реферальной статистики
func (r *Repository) GetReferralStats(ctx context.Context, clientID uuid.UUID) (*models.ReferralStats, error) {
	var stats models.ReferralStats

	// Кол-во приглашённых
	err := database.DB.QueryRow(ctx,
		`SELECT COUNT(*) FROM clients WHERE referred_by = $1`,
		clientID,
	).Scan(&stats.Count)
	if err != nil {
		log.Printf("GetReferralStats count error: %v", err)
		return nil, err
	}

	// Сумма бонусов, заработанная через рефералов
	err = database.DB.QueryRow(ctx,
		`SELECT COALESCE(referral_earned_total, 0) FROM clients WHERE id = $1`,
		clientID,
	).Scan(&stats.Earned)
	if err != nil {
		log.Printf("GetReferralStats earned error: %v", err)
		return nil, err
	}

	return &stats, nil
}
