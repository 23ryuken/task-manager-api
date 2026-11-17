import { createHash } from "node:crypto"

const MAX_FAILED_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000
const MAX_TRACKED_LOGINS = 10_000
const failures = new Map()

function getKey(ip, email) {
    return createHash("sha256").update(`${ip}\0${email}`).digest("hex")
}

function getActiveFailure(key, now) {
    const failure = failures.get(key)
    if (failure && failure.expiresAt <= now) {
        failures.delete(key)
        return undefined
    }

    return failure
}

export function isLoginBlocked(ip, email) {
    const failure = getActiveFailure(getKey(ip, email), Date.now())
    return failure?.count >= MAX_FAILED_ATTEMPTS
}

export function recordLoginFailure(ip, email) {
    const now = Date.now()
    const key = getKey(ip, email)
    const failure = getActiveFailure(key, now)

    failures.delete(key)
    if (failures.size >= MAX_TRACKED_LOGINS) {
        const oldestKey = failures.keys().next().value
        if (oldestKey !== undefined) failures.delete(oldestKey)
    }

    failures.set(key, {
        count: (failure?.count ?? 0) + 1,
        expiresAt: now + WINDOW_MS,
    })
}

export function clearLoginFailures(ip, email) {
    failures.delete(getKey(ip, email))
}
