import assert from "node:assert/strict"
import test from "node:test"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../src/models/User.js"
import { login } from "../src/controllers/authController.js"
import { clearLoginFailures } from "../src/middleware/loginFailureLimiter.js"

function createResponse() {
    return {
        statusCode: undefined,
        body: undefined,
        status(code) {
            this.statusCode = code
            return this
        },
        json(body) {
            this.body = body
            return this
        },
    }
}

test("login limits repeated incorrect passwords by IP and email", async (t) => {
    const ip = "198.51.100.20"
    const email = "person@example.com"
    clearLoginFailures(ip, email)
    let lookupCount = 0

    t.mock.method(User, "findOne", () => {
        lookupCount += 1
        return { select: async () => ({ password: "hashed-password" }) }
    })
    t.mock.method(bcrypt, "compare", async () => false)

    for (let attempt = 0; attempt < 5; attempt += 1) {
        const response = createResponse()
        await login({ ip, body: { email, password: "incorrect" } }, response)
        assert.equal(response.statusCode, 401)
    }

    const response = createResponse()
    await login({ ip, body: { email, password: "incorrect" } }, response)
    assert.equal(response.statusCode, 429)
    assert.equal(lookupCount, 5)
})

test("successful login uses a fallback expiration only when unset", async (t) => {
    const originalExpiration = process.env.JWT_EXPIRES_IN
    const signedExpirations = []

    t.mock.method(User, "findOne", () => ({
        select: async () => ({
            _id: "user-id",
            name: "Person",
            email: "person@example.com",
            password: "hashed-password",
        }),
    }))
    t.mock.method(bcrypt, "compare", async () => true)
    t.mock.method(jwt, "sign", (_payload, _secret, options) => {
        signedExpirations.push(options.expiresIn)
        return "signed-token"
    })

    try {
        delete process.env.JWT_EXPIRES_IN
        for (const [ip, expectedExpiration] of [
            ["198.51.100.21", "1h"],
            ["198.51.100.22", "2d"],
        ]) {
            if (expectedExpiration === "2d") process.env.JWT_EXPIRES_IN = expectedExpiration
            const response = createResponse()
            await login(
                { ip, body: { email: "person@example.com", password: "correct" } },
                response,
            )
            assert.equal(response.statusCode, 200)
            assert.equal(response.body.token, "signed-token")
        }
    } finally {
        if (originalExpiration === undefined) {
            delete process.env.JWT_EXPIRES_IN
        } else {
            process.env.JWT_EXPIRES_IN = originalExpiration
        }
    }

    assert.deepEqual(signedExpirations, ["1h", "2d"])
})
