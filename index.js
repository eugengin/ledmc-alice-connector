const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/**
 * --- OAuth ---
 */

// Шаг 1. Авторизация
app.get("/oauth/authorize", (req, res) => {
  const { client_id, redirect_uri, state } = req.query;

  // Простейшая заглушка: сразу редиректим обратно в Алису
  const code = "test_auth_code";
  res.redirect(`${redirect_uri}?code=${code}&state=${state}`);
});

// Шаг 2. Получение токена
app.post("/oauth/token", (req, res) => {
  res.json({
    access_token: "test_access_token",
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: "test_refresh_token"
  });
});

/**
 * --- Устройства ---
 */

// Список устройств
app.get("/devices", (req, res) => {
  res.json({
    request_id: "1",
    payload: {
      user_id: "test_user",
      devices: [
        {
          id: "lamp1",
          name: "Лампа LED-MC",
          type: "devices.types.light",
          capabilities: [
            { type: "devices.capabilities.on_off", retrievable: true },
            {
              type: "devices.capabilities.range",
              retrievable: true,
              parameters: {
                instance: "brightness",
                unit: "unit.percent",
                range: { min: 0, max: 100, precision: 1 }
              }
            },
            {
              type: "devices.capabilities.color_setting",
              retrievable: true,
              parameters: { color_model: "rgb" }
            },
            {
              type: "devices.capabilities.mode",
              retrievable: true,
              parameters: {
                instance: "scene",
                modes: [
                  { value: "breathing" },
                  { value: "flash" },
                  { value: "text_sync" }
                ]
              }
            }
          ]
        }
      ]
    }
  });
});

// Выполнение команд
app.post("/devices/action", (req, res) => {
  const devices = req.body.payload.devices.map((device) => {
    return {
      id: device.id,
      capabilities: device.capabilities.map((cap) => ({
        type: cap.type,
        state: {
          instance: cap.state.instance,
          action_result: { status: "DONE" }
        }
      }))
    };
  });

  res.json({
    request_id: req.body.request_id || "1",
    payload: { devices }
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`LED-MC connector running on port ${port}`)
);
