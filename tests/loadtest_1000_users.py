import concurrent.futures
import json
import random
import time
import urllib.error
import urllib.request
import uuid

BASE_URL = "http://localhost:8080"

def post_json(path, payload, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="ignore")
    except Exception as e:
        return 599, str(e)

def main():
    suffix = random.randint(10000, 99999)
    # Register a buyer account to obtain a valid JWT
    status, reg = post_json("/api/auth/register", {
        "email": f"stampede_{suffix}@veritix.io",
        "password": "Password123!",
        "fullName": "Stampede Load Buyer",
        "phone": f"+9191{random.randint(10000000, 99999999)}",
        "role": "ROLE_ATTENDEE",
    })
    if status != 200:
        raise RuntimeError(f"Registration failed: {status} {reg}")
    token = reg["data"]["accessToken"]

    TOTAL_REQUESTS = 1000
    CONCURRENCY = 200  # 200 simultaneous worker threads hammering 1,000 requests

    print(f"Firing {TOTAL_REQUESTS} concurrent booking requests ({CONCURRENCY} threads)...")
    t0 = time.perf_counter()

    def attempt_booking(_idx):
        code, _ = post_json(
            "/api/bookings/initiate",
            {"eventId": 1, "ticketTierId": 1, "idempotencyKey": str(uuid.uuid4())},
            token=token,
        )
        return code

    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as pool:
        results = list(pool.map(attempt_booking, range(TOTAL_REQUESTS)))

    elapsed = time.perf_counter() - t0
    counts = {}
    for code in results:
        counts[code] = counts.get(code, 0) + 1

    print(f"Completed {TOTAL_REQUESTS} requests in {elapsed:.2f}s ({TOTAL_REQUESTS/elapsed:.1f} req/s)")
    print("HTTP Status Breakdown:", counts)

    server_errors = sum(v for k, v in counts.items() if k >= 500)
    if server_errors > 0:
        raise AssertionError(f"Detected {server_errors} 5xx server/pool errors!")
    print("[PASS][CON-01] Zero 5xx server errors under 1,000-user stampede.")

if __name__ == "__main__":
    main()
