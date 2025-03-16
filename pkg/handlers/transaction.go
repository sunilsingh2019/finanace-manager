package handlers

import (
	"database/sql"
	"net/http"
	"personal-finance/pkg/models"

	"github.com/gin-gonic/gin"
)

type TransactionHandler struct {
	db *sql.DB
}

func NewTransactionHandler(db *sql.DB) *TransactionHandler {
	return &TransactionHandler{db: db}
}

func (h *TransactionHandler) Create(c *gin.Context) {
	userID := c.GetInt("user_id")

	var input struct {
		Amount      float64 `json:"amount" binding:"required"`
		Type        string  `json:"type" binding:"required,oneof=income expense"`
		Category    string  `json:"category" binding:"required"`
		Description string  `json:"description"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := models.NewTransaction(
		userID,
		input.Amount,
		models.TransactionType(input.Type),
		input.Category,
		input.Description,
	)

	result := h.db.QueryRow(`
		INSERT INTO transactions (user_id, amount, type, category, description, date, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id`,
		tx.UserID, tx.Amount, tx.Type, tx.Category, tx.Description, tx.Date, tx.CreatedAt, tx.UpdatedAt,
	)

	if err := result.Scan(&tx.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error saving transaction"})
		return
	}

	c.JSON(http.StatusCreated, tx)
}

func (h *TransactionHandler) List(c *gin.Context) {
	userID := c.GetInt("user_id")

	rows, err := h.db.Query(`
		SELECT id, amount, type, category, description, date, created_at, updated_at
		FROM transactions
		WHERE user_id = $1
		ORDER BY date DESC`,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching transactions"})
		return
	}
	defer rows.Close()

	var transactions []models.Transaction
	for rows.Next() {
		var tx models.Transaction
		err := rows.Scan(
			&tx.ID,
			&tx.Amount,
			&tx.Type,
			&tx.Category,
			&tx.Description,
			&tx.Date,
			&tx.CreatedAt,
			&tx.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading transactions"})
			return
		}
		tx.UserID = userID
		transactions = append(transactions, tx)
	}

	c.JSON(http.StatusOK, transactions)
}

func (h *TransactionHandler) Summary(c *gin.Context) {
	userID := c.GetInt("user_id")

	var summary struct {
		TotalIncome  float64 `json:"total_income"`
		TotalExpense float64 `json:"total_expense"`
		Balance      float64 `json:"balance"`
	}

	err := h.db.QueryRow(`
		SELECT 
			COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
			COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
		FROM transactions
		WHERE user_id = $1`,
		userID,
	).Scan(&summary.TotalIncome, &summary.TotalExpense)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error calculating summary"})
		return
	}

	summary.Balance = summary.TotalIncome - summary.TotalExpense
	c.JSON(http.StatusOK, summary)
}
