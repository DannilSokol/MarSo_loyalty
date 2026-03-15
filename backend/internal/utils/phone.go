package utils

import (
	"errors"
	"regexp"
	"strings"
)

var phoneRegex = regexp.MustCompile(`^\+7\d{10}$`)

func NormalizePhone(raw string) (string, error) {
	if raw == "" {
		return "", errors.New("номер телефона обязателен")
	}

	clean := regexp.MustCompile(`[^\d+]`).ReplaceAllString(raw, "")

	switch {
	case strings.HasPrefix(clean, "8") && len(clean) == 11:
		clean = "+7" + clean[1:]
	case strings.HasPrefix(clean, "7") && len(clean) == 11:
		clean = "+7" + clean[1:]
	case strings.HasPrefix(clean, "+7") && len(clean) == 12:
		// ок
	default:
		return "", errors.New("номер должен начинаться с +7 или 8 и содержать 11 цифр")
	}

	if !phoneRegex.MatchString(clean) {
		return "", errors.New("неверный формат: ожидается +7XXXXXXXXXX")
	}

	return clean, nil
}

func IsValidPhone(phone string) bool {
	_, err := NormalizePhone(phone)
	return err == nil
}
