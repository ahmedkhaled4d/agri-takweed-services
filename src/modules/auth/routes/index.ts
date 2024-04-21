import express from "express";
import {
  createExpressServer,
  handleExpressError
} from "../../../helpers/express";
import {
  extractToken,
  Log,
  protectedAuth,
  verifyRoles
} from "../../../middlewares"; /** impoort Controllers */
import * as forgetController from "../controllers/forget.controller";
import * as loginController from "../controllers/login.controller";
import * as signupController from "../controllers/signup.controller";

const router = express.Router();

router.use(protectedAuth); // protect all routes
/**
 * @swagger
 * /auth/signup:
 *  post:
 *    requestBody:
 *      name: Register User
 *      required: true
 *      description: The User we want to register.
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/userRegBody'
 *    tags:
 *    - auth client
 *    summary: Create a new user
 *    description: Create a new user
 *    responses:
 *      201:
 *        description: Success
 *        content:
 *          application/json:
 *           schema:
 *             type: object
 *             properties:
 *              message:
 *               type: string
 *              phone:
 *                type: string
 *              checkcode:
 *                type: string
 *      401:
 *        $ref: '#/components/responses/UnauthorizedError'
 *      500:
 *        description: server Side error, no data.
 */
router.post("/signup", signupController.signup);
/**
 * @swagger
 * /auth/signup/admin:
 *  post:
 *    requestBody:
 *      name: Register User
 *      required: true
 *      description: The User we want to register.
 *      content:
 *        application/json:
 *          schema:
 *            allOf:
 *              - type: object
 *                properties:
 *                  role:
 *                    type: string
 *                    description: The User role could be hagr or admin.
 *                    example: hagr
 *              - $ref: '#/components/schemas/userRegBody'
 *    tags:
 *    - auth admin
 *    summary: Create a new user admin or hagr
 *    description: Create a new admin or hagr
 *    responses:
 *      201:
 *        description: Success
 *        content:
 *          application/json:
 *           schema:
 *             type: object
 *             properties:
 *              message:
 *               type: string
 *              phone:
 *               type: string
 *              checkcode:
 *               type: string
 *      401:
 *        $ref: '#/components/responses/UnauthorizedError'
 *      500:
 *        description: server Side error, no data.
 */
router.post(
  "/signup/admin",
  extractToken,
  verifyRoles(["admin"]),
  signupController.signupAdmin
);
/**
 * @swagger
 * /auth/login:
 *  post:
 *    requestBody:
 *      name: Login User
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *              $ref: '#/components/schemas/userLogin'
 *    tags:
 *    - auth client
 *    summary: Login User
 *    description: Login User
 *    responses:
 *      200:
 *        description: Success
 *        content:
 *          application/json:
 *           schema:
 *              $ref: '#/components/schemas/LoginResponse'
 *      401:
 *        description: Requires Registeration or no OTP Token Found
 *      403:
 *        description: Wrong phone or password, or not OTP Verifed.
 *      500:
 *        description: server Side error, no data.
 */
router.post("/login", loginController.loginByPhone);
/**
 * @swagger
 * /auth/login/admin:
 *  post:
 *    requestBody:
 *      name: Login Admin
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *              $ref: '#/components/schemas/adminLogin'
 *    tags:
 *    - auth admin
 *    summary: Login User
 *    description: Login User
 *    responses:
 *      200:
 *        description: Success
 *        content:
 *          application/json:
 *           schema:
 *             type: object
 *             properties:
 *              message:
 *               type: string
 *              phone:
 *               type: string
 *              checkcode:
 *               type: string
 *      401:
 *        $ref: '#/components/responses/UnauthorizedError'
 *      403:
 *        description: Wrong Email Or password
 *      500:
 *        description: server Side error, no data.
 */
router.post("/login/admin", loginController.loginByEmail);
/**
 * @swagger
 * /auth/verify:
 *  post:
 *    requestBody:
 *      name: Verify OTP
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *              $ref: '#/components/schemas/phoneVerify'
 *    tags:
 *    - auth client
 *    summary: Verify OTP and get token
 *    description: verify OTP
 *    responses:
 *      200:
 *        description: Success
 *        content:
 *          application/json:
 *           schema:
 *             type: object
 *             properties:
 *              message:
 *               type: string
 *              phone:
 *               type: string
 *              checkcode:
 *               type: string
 *      401:
 *        $ref: '#/components/responses/UnauthorizedError'
 *      403:
 *        description: Phone doesn't exist.
 *      500:
 *        description: server Side error, no data.
 */
router.post("/verify", loginController.verifyOTP);
router.get("/me", extractToken, loginController.checkCookie);
router.post("/logout", loginController.logout);
/**
 * @swagger
 * /auth/change-password:
 *  post:
 *    requestBody:
 *      name: Change pass body
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                phone:
 *                   type: string
 *    tags:
 *    - auth client
 *    summary: Login User
 *    description: Login User
 *    responses:
 *      201:
 *        description: Success
 *        content:
 *          application/json:
 *           schema:
 *              $ref: '#/components/schemas/LoginResponse'
 *      400:
 *        description: No bearer Token or malformed, Relogin.
 *      401:
 *        $ref: '#/components/responses/UnauthorizedError'
 *      403:
 *        description: User doesn't exist.
 *      500:
 *        description: server Side error, no data.
 */
router.put("/change-password", forgetController.changePassword);
/**
 * @swagger
 * /auth/resend:
 *  post:
 *    requestBody:
 *      name: Resend OTP
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                phone:
 *                   type: string
 *    tags:
 *    - auth client
 *    summary: Resend OTP
 *    description: Resend OTP
 *    responses:
 *      201:
 *        description: Success
 *        content:
 *          application/json:
 *           schema:
 *             type: object
 *             properties:
 *              message:
 *               type: string
 *              phone:
 *               type: string
 *              checkcode:
 *               type: string
 *      400:
 *        description: Error From SMS Service.
 *      401:
 *        $ref: '#/components/responses/UnauthorizedError'
 *      403:
 *        description: Phone doesn't exist.
 *      500:
 *        description: server Side error, no data.
 */
router.post("/resend", forgetController.resendOtp);
router.post(
  "/eng",
  extractToken,
  verifyRoles(["admin"]),
  Log,
  signupController.addEng
);

const AUTH_APP = createExpressServer();

AUTH_APP.use(router);

handleExpressError(AUTH_APP);
export default AUTH_APP;
