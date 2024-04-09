import express from "express";
import {
  getUser,
  passwordReset,
  register,
  registerSuperAdmin,
  signIn,
  updateEmail,
  updateUser,
  validateEmailUpdate,
  validatePasswordReset,
  validateToken,
  verifyLoginOTP,
  verifyOTP,
  verifySuperAdmin,
} from "../controller/users";
import { verifyToken } from "../middleware/auth";
import {check} from "express-validator"

const router = express.Router();

/**
 * @openapi
 * /api/v1/register:
 *   post:
 *     tags:
 *       - "User Register"
 *     description: "Signup a new user"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: "object"
 *             properties:
 *               email:
 *                 type: "string"
 *               name:
 *                 type: "string"
 *               password:
 *                 type: "string"
 *     responses:
 *       "200":
 *         description: "OTP Sent to your email"
 */
router.post("/register",[
  check("name","This field is required").isString(),
  check("email","This field is required").isEmail(),
  check("password","This field is required").isString()
], register);


/**
 * @openapi
 * /api/v1/verify-otp:
 *   post:
 *     tags: 
 *       - "User Register"
 *     description: "Verify OTP"
 *     requestBody:  
 *       content:
 *         application/json:
 *           schema:
 *             type: "object"
 *             properties:
 *               email:
 *                 type: "string"  
 *               otp:  
 *                 type: "string"  
 *     responses:
 *       "200":
 *         description: "OTP Verified"
 *       "400": 
 *         description: "Invalid OTP"  
 */
router.post("/verify-otp",[check("email","This field is required").isEmail(),check("otp","This field is required").isString()], verifyOTP);



/**
 * @openapi
 * /api/v1/login:
 *  post:
 *   tags:
 *    - "User Login"
 *  description: "Login"
 * requestBody:
 *   content:
 *    application/json:
 *     schema:
 *     type: "object"
 *     properties:
 *      email:
 *        type: "string"
 *     password:
 *       type: "string"
 * 
 * responses:
 *   "200":
 *    description: "Login Successful"
 *   "400":
 *    description: "Invalid Email or Password"
 * 
 * 
 */
router.post("/login",[
  check("email","This field is required").isEmail(),
  check("password","This field is required").isString()
], signIn);

/**
 * @openapi
 * /api/v1/verify-login-otp:
 *  post:
 *    tags:
 *    - "User Login"
 *    description: "Verify Login OTP"
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: "object"
 *          properties:
 *            email:
 *              type: "string"
 *            otp:
 *              type: "string"
 * 
 *    responses:
 *      "200":
 *        description: "Login Successful"
 *      "400":
 *        description: "Invalid OTP"
 * 
 * 
 * 
 */
router.post("/verify-login-otp",[
  check("email","This field is required").isEmail(),
  check("otp","This field is required").isString()  
], verifyLoginOTP);


/** 
 * @openapi
 * /api/v1/validate-token:
 *  get:
 *    tags:
 *       - "Check If User Is Logged In"
 *    description: "To Check if the User is Logged In Via Token"
 *    responses:
 *      "200":
 *        description: "returns user id"
 *      "401":
 *        description: "throws error if token is invalid or expired"
 * 
 */
router.get("/validate-token", verifyToken, validateToken);

/** 
 * @openapi
 *  /api/v1/user:
 *    get: 
 *     tags:
 *      - "User"
 *     description: "Get User Details"
 *     responses:
 *      "200":
 *        description: "User Details"
 *       
 */
router.get("/user", verifyToken, getUser);

/**
 * @openapi
 * /api/v1/update:
 *    post:
 *      tags:
 *        - "User"
 *      description: "Update User Details"
 *      requestBody:
 *       content:
 *        application/json:
 *          schema:
 *            type: "object"
 *            properties:
 *              name:
 *                type: "string"
 *              password:
 *                type: "string"
 *              profilePic:
 *                type:"string base64 image"
 *    responses:
 *        "200":
 *          description: "User Details Updated Successfully"
 *              
 *        
 */
router.post("/update", verifyToken, updateUser);

/**
 * @openapi
 *  /api/v1/update-email:
 *    post:
 *      tags:
 *          - "User Email Update"
 *      description: "Update User Email"
 *      requestBody:
 *          content:
 *              application/json:
 *                schema:
 *                   type: "object"
 *                   properties:
 *                      email:
 *                        type: "string"
 *      
 *      responses:
 *            "200":
 *                description: "Otp sent to your email"
 *            
 *      
 * 
 */
router.post("/update-email", verifyToken,[
  check("email","This field is required").isEmail() 
],updateEmail)


/**
 * @openapi
 * /api/v1/validate-email-update:
 *    post:
 *      tags:
 *        - "User Email Update"
 *      description: "Validate Email Update"
 *      requestBody:
 *          content:
 *            application/json:
 *                schema:
 *                    type: "object"
 *                    properties:
 *                    email:
 *                      type: "string"
 *                    otp:
 *                      type: "string"
 *      responses:
 *          "200":
 *            description: "Email Updated Successfully"
 *          "400":
 *            description: "Invalid OTP"
 */
router.post("/validate-email-update", verifyToken,[
  check("email","This field is required").isEmail(),
  check("otp","This field is required").isString()
], validateEmailUpdate);


/**
 * @openapi
 * /api/v1/password-reset:
 *    get:
 *      tags:
 *        - "User Password Reset"
 *      description: "Password Reset"
 *      responses:
 *          "200":
 *            description: "OTP Sent to your email"
 */
router.get("/password-reset", verifyToken, passwordReset);

/**
 * @openapi
 * /api/v1/validate-password-reset:
 *    post:
 *      tags:
 *        - "User Password Reset"
 *      description: "Validate Password Reset"
 *      requestBody:
 *          content:
 *            application/json:
 *                schema:
 *                    type: "object"
 *                    properties:
 *                      password:
 *                        type: "string"
 *                      otp:
 *                        type: "string"
 *      responses:
 *          "200":
 *            description: "Password Reset Successful"
 *          "400":
 *            description: "Invalid OTP"
 */
router.post("/validate-password-reset", verifyToken, validatePasswordReset);

/**
 * @openapi
 * /api/v1/register-superadmin:
 *        post:
 *          tags:
 *             - "Super Admin Register"
 *          description: "Register Super Admin"
 *          requestBody:
 *              content:
 *                application/json:
 *                    schema:
 *                      type: "object"
 *                      properties:
 *                        name:
 *                          type: "string"
 *                        email:
 *                          type: "string"
 *                        password:
 *                          type: "string"
 *          responses:
 *              "200":
 *                 description: "OTP Sent to your email"
 */
router.post("/register-superadmin",[
    check("name","This field is required").isString(),
    check("email","This field is required").isEmail(),
    check("password","This field is required").isString()
], registerSuperAdmin);

/**
 * @openapi
 * /api/v1/verify-superadmin:
 *    post:
 *      tags:
 *        - "Super Admin Register"
 *      description: "Verify Super Admin"
 *      requestBody:
 *          content:
 *            application/json:
 *                schema:
 *                    type: "object"
 *                    properties:
 *                      email:
 *                        type: "string"
 *                      otp:
 *                        type: "string"
 *      responses:
 *          "200":
 *            description: "Super Admin Registered"
 *          "400":
 *            description: "Invalid OTP"
 */
router.post("/verify-superadmin",[
  check("email","This field is required").isEmail(),
  check("otp","This field is required").isString()

], verifySuperAdmin);

export default router;
