package main

import (
	"log"
	"os"
	"personal-finance/pkg/database"
	"personal-finance/pkg/handlers"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database
	dbConfig := &database.Config{
		Host:     os.Getenv("DB_HOST"),
		Port:     os.Getenv("DB_PORT"),
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASSWORD"),
		DBName:   os.Getenv("DB_NAME"),
	}

	db, err := database.NewConnection(dbConfig)
	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}
	defer db.Close()

	// Initialize database schema
	if err := database.InitSchema(db); err != nil {
		log.Fatalf("Could not initialize database schema: %v", err)
	}

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db)
	transactionHandler := handlers.NewTransactionHandler(db)

	// Initialize router
	router := gin.Default()

	// Serve static files
	router.Static("/static", "./static")

	// Load HTML templates
	router.LoadHTMLGlob("templates/*")

	// Public routes
	router.GET("/", func(c *gin.Context) {
		c.HTML(200, "layout.html", gin.H{
			"title": "Welcome",
			"template": "index.html",
		})
	})

	router.GET("/login", func(c *gin.Context) {
		c.HTML(200, "layout.html", gin.H{
			"title": "Login",
			"template": "login.html",
		})
	})

	router.GET("/register", func(c *gin.Context) {
		c.HTML(200, "layout.html", gin.H{
			"title": "Register",
			"template": "register.html",
		})
	})

	// API routes
	api := router.Group("/api")
	{
		api.POST("/register", authHandler.Register)
		api.POST("/login", authHandler.Login)

		// Protected routes
		protected := api.Group("/")
		protected.Use(handlers.AuthMiddleware())
		{
			protected.GET("/transactions", transactionHandler.List)
			protected.POST("/transactions", transactionHandler.Create)
			protected.GET("/transactions/summary", transactionHandler.Summary)
		}
	}

	// Protected page routes
	auth := router.Group("/")
	auth.Use(func(c *gin.Context) {
		if c.Request.URL.Path == "/login" || c.Request.URL.Path == "/register" {
			c.Next()
			return
		}

		token := c.GetHeader("Authorization")
		if token == "" {
			c.Redirect(302, "/login")
			c.Abort()
			return
		}
		c.Next()
	})
	{
		auth.GET("/dashboard", func(c *gin.Context) {
			c.HTML(200, "layout.html", gin.H{
				"title":         "Dashboard",
				"template":      "dashboard.html",
				"authenticated": true,
			})
		})
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router.Run(":" + port)
}
