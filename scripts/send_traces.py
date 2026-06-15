"""Send 10 requests to generate Langfuse traces."""
import httpx
import time

BASE_URL = "http://127.0.0.1:8000"

payloads = [
    {"user_id": "u_team_01", "session_id": "s_demo_01", "feature": "qa", "message": "What is the refund policy?"},
    {"user_id": "u_team_02", "session_id": "s_demo_02", "feature": "summary", "message": "How does monitoring work?"},
    {"user_id": "u_team_01", "session_id": "s_demo_01", "feature": "qa", "message": "Tell me about the policy for PII in logs"},
    {"user_id": "u_team_03", "session_id": "s_demo_03", "feature": "qa", "message": "What are best practices for observability?"},
    {"user_id": "u_team_02", "session_id": "s_demo_02", "feature": "summary", "message": "Summarize the refund process"},
    {"user_id": "u_team_01", "session_id": "s_demo_01", "feature": "qa", "message": "How do metrics detect incidents?"},
    {"user_id": "u_team_04", "session_id": "s_demo_04", "feature": "qa", "message": "Explain monitoring and alerting strategies"},
    {"user_id": "u_team_03", "session_id": "s_demo_03", "feature": "summary", "message": "Give me a policy overview"},
    {"user_id": "u_team_02", "session_id": "s_demo_02", "feature": "qa", "message": "What tools help with refund tracking?"},
    {"user_id": "u_team_04", "session_id": "s_demo_04", "feature": "summary", "message": "How do traces localize issues in monitoring systems?"},
]


def main():
    with httpx.Client(timeout=30.0) as client:
        # First check health
        health = client.get(f"{BASE_URL}/health")
        print(f"Health check: {health.json()}")
        print(f"Tracing enabled: {health.json().get('tracing_enabled')}")
        print("-" * 60)

        for i, payload in enumerate(payloads, 1):
            try:
                resp = client.post(f"{BASE_URL}/chat", json=payload)
                data = resp.json()
                print(
                    f"[{i:2d}/10] Status={resp.status_code} | "
                    f"CorrID={data.get('correlation_id', 'N/A')[:16]}... | "
                    f"Feature={payload['feature']:8s} | "
                    f"Latency={data.get('latency_ms', 0)}ms | "
                    f"Quality={data.get('quality_score', 0)}"
                )
            except Exception as e:
                print(f"[{i:2d}/10] ERROR: {e}")
            time.sleep(0.3)

    print("-" * 60)
    print("Done! 10 traces sent to Langfuse.")
    print("Check your traces at: https://cloud.langfuse.com")


if __name__ == "__main__":
    main()
