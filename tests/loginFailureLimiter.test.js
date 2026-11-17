import assert from "node:assert/strict"
import test from "node:test"
import {
    clearLoginFailures,
    isLoginBlocked,
    recordLoginFailure,
} from "../src/middleware/loginFailureLimiter.js"

test("login failures are scoped by IP and email and expire", () => {
    let now = 1_000
    const originalNow = Date.now
    Date.now = () => now

    try {
        for (let attempt = 0; attempt < 5; attempt += 1) {
            recordLoginFailure("192.0.2.1", "person@example.com")
        }

        assert.equal(isLoginBlocked("192.0.2.1", "person@example.com"), true)
        assert.equal(isLoginBlocked("192.0.2.2", "person@example.com"), false)
        assert.equal(isLoginBlocked("192.0.2.1", "other@example.com"), false)

        clearLoginFailures("192.0.2.1", "person@example.com")
        assert.equal(isLoginBlocked("192.0.2.1", "person@example.com"), false)

        for (let attempt = 0; attempt < 5; attempt += 1) {
            recordLoginFailure("192.0.2.1", "person@example.com")
        }
        now += 15 * 60 * 1000
        assert.equal(isLoginBlocked("192.0.2.1", "person@example.com"), false)
    } finally {
        Date.now = originalNow
    }
})
