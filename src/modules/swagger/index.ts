import express from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { ExpressFunc } from "../../types";

export const SWAGGER_APP = express();

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mahaseel Masr Backend.",
      description: "This is a backend for Mahaseel company.",
      version: "1.0.0"
    },
    components: {
      securitySchemes: {
        Bearer: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        },
        otptoken: {
          type: "apiKey",
          name: "otptoken",
          in: "header"
        },
        target: {
          type: "apiKey",
          name: "target",
          in: "header"
        }
      },
      responses: {
        UnauthorizedError: {
          description: "Bearer token is missing or invalid"
        }
      }
    },
    security: [
      {
        Bearer: [],
        target: []
      }
    ],
    servers: [
      {
        url: "https://mahaseel.ddns.net/dev/api",
        description: "Development Server"
      },
      {
        url: "http://localhost:5000/takweed-eg/us-central1",
        description: "Local Server"
      }
    ]
  },
  apis: ["./src/modules/**/routes/**/*.ts", "./src/modules/**/*.schema.yaml"]
};
const swaggerSpec = swaggerJsdoc(options);

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const setup: ExpressFunc = (req, res, next) => {
  try {
    return [swaggerUi.serve, swaggerUi.setup(swaggerSpec)];
  } catch (e) {
    console.log(e);
  }
};
SWAGGER_APP.use("/", setup);
// Dosc in json format.
SWAGGER_APP.get("/docs.json", (_, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

export default SWAGGER_APP;
