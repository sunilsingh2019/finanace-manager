package models

import (
	"time"
)

type TransactionType string

const (
	Income  TransactionType = "income"
	Expense TransactionType = "expense"
)

type Transaction struct {
	ID          int             `json:"id"`
	UserID      int             `json:"user_id"`
	Amount      float64         `json:"amount"`
	Type        TransactionType `json:"type"`
	Category    string          `json:"category"`
	Description string          `json:"description"`
	Date        time.Time       `json:"date"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

func NewTransaction(userID int, amount float64, transType TransactionType, category, description string) *Transaction {
	return &Transaction{
		UserID:      userID,
		Amount:      amount,
		Type:        transType,
		Category:    category,
		Description: description,
		Date:        time.Now(),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}
