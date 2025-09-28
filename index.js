const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

/**
 * --- Устройства ---
 */
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

/**
 * --- DISCOVERY (список устройств) ---
 */
app.post("/v1.0/user/devices", (req, res) => {
  res.json({
    request_id: req.body.request_id || "1",
    payload: {
      user_id: "test_user",
      devices: devices
    }
  });
});

/**
 * --- QUERY (состояния устройств) ---
 */
app.post("/v1.0/user/devices/query", (req, res) => {
  const result = devices.map(device => ({
    id: device.id,
    capabilities: [
      {
        type: "devices.capabilities.on_off",
        state: { instance: "on", value: true }
      },
      {
        type: "devices.capabilities.range",
        state: { instance: "brightness", value: 50 }
      },
      {
        type: "devices.capabilities.color_setting",
        state: { instance: "rgb", value: 16711680 } // красный (RGB)
      }
    ],
    properties: []
  }));

  res.json({
    request_id: req.body.request_id || "1",
    payload: { devices: result }
  });
});

/**
 * --- ACTION (выполнение команд) ---
 */
app.post("/v1.0/user/devices/action", (req, res) => {
  const devicesReq = req.body.payload.devices;

  const result = devicesReq.map(device => ({
    id: device.id,
    capabilities: device.capabilities.map(cap => ({
      type: cap.type,
      state: {
        instance: cap.state.instance,
        action_result: { status: "DONE" }
      }
    }))
  }));

  res.json({
    request_id: req.body.request_id || "1",
    payload: { devices: result }
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`LED-MC connector running on port ${port}`);
});
