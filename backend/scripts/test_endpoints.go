package main

import (
	"bytes"
	"fmt"
	"net/http"
	"time"
)

func main() {
	baseURL := "http://localhost:8080"

	fmt.Println("🔍 Тестирование endpoints MarSo Loyalty")
	fmt.Println("======================================")

	client := &http.Client{Timeout: 5 * time.Second}

	// 1. Health check (GET)
	testEndpoint(client, baseURL, "GET", "/health", "")

	// 2. Version (GET)
	testEndpoint(client, baseURL, "GET", "/version", "")

	// 3. Login клиента (POST)
	loginData := `{"phone": "+79991234567"}`
	testEndpoint(client, baseURL, "POST", "/api/auth/login", loginData)

	// 4. Получить клиентов (GET с Basic Auth)
	testAdminEndpoint(client, baseURL, "GET", "/api/admin/clients", "")

	// 5. Тест создания посещения (POST с Basic Auth)
	visitData := `{"phone": "+79991234567", "amount": 1000, "note": "Test"}`
	testAdminEndpoint(client, baseURL, "POST", "/api/admin/visits", visitData)
}

func testEndpoint(client *http.Client, baseURL, method, endpoint, body string) {
	url := baseURL + endpoint

	var req *http.Request
	var err error

	if body != "" {
		req, err = http.NewRequest(method, url, bytes.NewBuffer([]byte(body)))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, err = http.NewRequest(method, url, nil)
	}

	if err != nil {
		fmt.Printf("❌ %s %s: Ошибка создания запроса: %v\n", method, endpoint, err)
		return
	}

	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("❌ %s %s: Ошибка подключения: %v\n", method, endpoint, err)
		return
	}

	status := "✅"
	if resp.StatusCode >= 400 {
		status = "⚠️ "
	}

	fmt.Printf("%s %s %s: %d %s\n", status, method, endpoint, resp.StatusCode, resp.Status)
	resp.Body.Close()
}

func testAdminEndpoint(client *http.Client, baseURL, method, endpoint, body string) {
	url := baseURL + endpoint

	var req *http.Request
	var err error

	if body != "" {
		req, err = http.NewRequest(method, url, bytes.NewBuffer([]byte(body)))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, err = http.NewRequest(method, url, nil)
	}

	if err != nil {
		fmt.Printf("❌ %s %s: Ошибка создания запроса: %v\n", method, endpoint, err)
		return
	}

	// Добавляем Basic Auth для админских endpoints
	req.SetBasicAuth("admin", "marso123")

	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("❌ %s %s: Ошибка подключения: %v\n", method, endpoint, err)
		return
	}

	status := "✅"
	if resp.StatusCode >= 400 {
		status = "⚠️ "
	}

	fmt.Printf("%s %s %s: %d %s\n", status, method, endpoint, resp.StatusCode, resp.Status)
	resp.Body.Close()
}
