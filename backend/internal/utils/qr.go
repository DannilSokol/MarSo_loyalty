package utils

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/skip2/go-qrcode"
	_ "github.com/skip2/go-qrcode"
)

type QRPayload struct {
	ClientID string `json:"client_id"`
	Token    string `json:"token"`
}

func GenerateQR(clientID string, oneTimeToken string) (string, error) {
	payload := QRPayload{
		ClientID: clientID,
		Token:    oneTimeToken,
	}
	data, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	qr, err := qrcode.Encode(string(data), qrcode.Medium, 256)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("data:image/png;base64,%s", base64.StdEncoding.EncodeToString(qr)), nil
}
