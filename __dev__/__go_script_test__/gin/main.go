package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func logMid(c *gin.Context) {
	fmt.Println("log -start-")
	c.Next()
	fmt.Println("log -end-")
}

func main() {
	// Create a Gin router with default middleware (logger and recovery)
	r := gin.Default()

	r.Use(logMid)

	// Define a simple GET endpoint
	r.GET("/ping", func(c *gin.Context) {
		// Return JSON response
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	r.POST("/user", func(c *gin.Context) {
		type Req struct {
			Name string `json:"name"`
		}

		var req Req
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": req.Name})
	})

	// Start server on port 8080 (default)
	// Server will listen on 0.0.0.0:8080 (localhost:8080 on Windows)
	if err := r.Run(); err != nil {
		log.Fatalf("failed to run server: %v", err)
	}
}
