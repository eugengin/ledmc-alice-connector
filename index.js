const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Пример: одно тестовое устройство — лампа
const devices = [
  {
    id: "lamp1",
    name: "Тестовая лампа",
    type: "devices.types.light",
    capabilities: [
      {
        type: "devices.capabilities.on_off",
        retrievable: true,
        parameters: {}
      },
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
        parameters: {
          color_model: "rgb"
        }
      }
    ],
    properties: []
  }
];

// Разлогин
app.post("/user/unlink", (req, res) => {
  res.send({});
});

// DISCOVERY — список устройств
app.post("/v1.0/user/devices", (req, res) => {
  res.json({
    request_id: "discovery-12345",
    payload: { user_id: "user1", devices }
  });
});

// QUERY — запрос состояния
app.post("/v1.0/user/devices/query", (req, res) => {
  const result = req.body.devices.map(d => ({
    id: d.id,
    capabilities: [
      { type: "devices.capabilities.on_off", state: { instance: "on", value: true } },
      { type: "devices.capabilities.range", state: { instance: "brightness", value: 80 } },
      { type: "devices.capabilities.color_setting", state: { instance: "rgb", value: 0xFFAA00 } }
    ]
  }));

  res.json({ request_id: "query-12345", payload: { devices: result } });
});

// ACTION — управление устройством
app.post("/v1.0/user/devices/action", (req, res) => {
  const result = req.body.payload.devices.map(d => ({
    id: d.id,
    capabilities: d.capabilities.map(c => ({
      type: c.type,
      state: { instance: c.state.instance, action_result: { status: "DONE" } }
    }))
  }));

  res.json({ request_id: "action-12345", payload: { devices: result } });
});

// Запуск сервера
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`LEDMC Alice Connector listening on ${port}`));
