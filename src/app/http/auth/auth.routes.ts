import { Router } from 'express';
import { requestHandler, requestValidator } from '@/libs/core';
import controller from './auth.controller';
import request from './auth.request';

const router = Router();

/**
 * POST /auth/login
 * @tags Auth
 * @summary Login
 * @description Endpoint ini digunakan untuk melakukan autentikasi pengguna dengan memasukkan username dan password.
 *
 * @typedef {object} Login
 * @property {string} username.required - Nama pengguna (username)
 * @property {string} password.required - Kata sandi (password)
 *
 * @param {Login} request.body.required - Payload login yang diperlukan untuk autentikasi
 *
 * @return {object} 200 - Sukses
 * @return {object} 400 - Bad request
 *
 * @example request - Payload contoh
 * {
 *   "username": "diki",
 *   "password": "dmain"
 * }
 *
 * @example response - 200 - Sukses
 * {
 *   "message": "Success",
 *   "result": {
 *     "user": {
 *       "id_user": 269,
 *       "nama": "Diki IT",
 *       "username": "diki",
 *       "input": "disable"
 *     },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c2VyIjoyNDgsIm5hbWEiOiJIRVJESU4iLCJ1c2VybmFtZSI6ImhlcmRpbiIsImlhdCI6MTcyNjEwNTI2MiwiZXhwIjoxNzI2NzEwMDYyfQ.P734DXutwFGDSL7eK0Alupc8NDz3ME0qI5G6sAF7ImU"
 *   }
 * }
 *
 * @example response - 400 - Bad Request
 * {
 *   "message": "Username dan Password harus berupa string",
 *   "result": null
 * }
 */
router.post(
	'/auth/login',
	requestValidator({
		requestType: 'body',
		type: request.loginValidation
	}),
	requestHandler(controller.login)
);

/**
 * GET /auth/logout
 * @tags Auth
 * @security BearerAuth
 * @summary Logout
 * @description Endpoint ini digunakan untuk mengeluarkan pengguna dari sesi aktif mereka.
 *
 * @return {object} 200 - Sukses
 *
 * @example response - 200 - Sukses
 * {
 *   "message": "Logout berhasil",
 *   "result": null
 * }
 */
router.get('/auth/logout', requestHandler(controller.logout));

/**
 * GET /auth/check-token
 * @tags Auth
 * @security BearerAuth
 * @summary Check Token Status
 * @description Endpoint ini digunakan untuk mengecek status token apakah masih valid atau sudah di-blacklist.
 *
 * @return {object} 200 - Sukses
 *
 * @example response - 200 - Sukses
 * {
 *   "message": "Success",
 *   "result": {
 *     "isValid": true,
 *     "isBlacklisted": false,
 *     "message": "Token masih valid"
 *   }
 * }
 */
router.get('/auth/check-token', requestHandler(controller.checkToken));

export default router;
