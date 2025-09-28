import express from "express";

const app = express();
app.use(express.json());

app.post("/v1.0/user/devices", (req, res) => {
  res.json({
    request_id: "demo-request",
    payload: {
      user_id: "demo-user",
      devices: [
        {
          id: "lamp1",
          name: "Тестовая лампа",
          type: "devices.types.light",
          capabilities: [
            {
              type: "devices.capabilities.on_off",
              retrievable: true
            },
            {
              type: "devices.capabilities.range",
              parameters: {
                instance: "brightness",
                unit: "percent",
                range: { min: 0, max: 100, precision: 1 }
              },
              retrievable: true
            },
            {
              type: "devices.capabilities.color_setting",
              parameters: {
                color_model: "rgb"
              },
              retrievable: true
            }
          ]
        }
      ]
    }
  });
});

app.listen(3000, () => console.log("Server ready on port 3000"));
