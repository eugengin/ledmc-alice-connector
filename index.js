// index.js
const express = require("express");
const app = express();

app.use(express.json());

// Проверка сервера
app.get("/", (req, res) => {
  res.send("LED-MC Alice Connector: Расширенный режим работает!");
});

// Эндпоинт авторизации (упрощённо)
app.get("/oauth/authorize", (req, res) => {
  res.send("Auth OK (расширенный)");
});

app.post("/oauth/token", (req, res) => {
  res.json({
    access_token: "test_token",
    token_type: "bearer",
    expires_in: 3600
  });
});

// Отдаём устройства Алисе
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
            { type: "devices.capabilities.range", retrievable: true, parameters: { instance: "brightness", unit: "unit.percent", range: { min: 0, max: 100, precision: 1 } } },
            { type: "devices.capabilities.color_setting", retrievable: true, parameters: { color_model: "rgb" } },
            { type: "devices.capabilities.mode", retrievable: true, parameters: { instance: "scene", modes: [
              { value: "breathing" },
              { value: "flash" },
              { value: "text_sync" }
            ] } }
          ]
        }
      ]
    }
  });
});

// Управление устройством
app.post("/devices/action", (req, res) => {
  const actions = req.body.payload.devices[0].capabilities;
  let result = [];

  actions.forEach(action => {
    if (action.type === "devices.capabilities.on_off") {
      result.push({ type: action.type, state: { instance: "on", action_result: { status: "DONE" } } });
    }
    if (action.type === "devices.capabilities.range" && action.state.instance === "brightness") {
      result.push({ type: action.type, state: { instance: "brightness", action_result: { status: "DONE" } } });
    }
    if (action.type === "devices.capabilities.color_setting") {
      result.push({ type: action.type, state: { instance: "rgb", action_result: { status: "DONE" } } });
    }
    if (action.type === "devices.capabilities.mode") {
      result.push({ type: action.type, state: { instance: "scene", action_result: { status: "DONE" } } });
    }
  });

  res.json({
    request_id: req.body.request_id || "1",
    payload: {
      devices: [
        {
          id: req.body.payload.devices[0].id,
          capabilities: result
        }
      ]
    }
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Extended server running on port ${port}`));
