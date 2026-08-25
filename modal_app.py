import os
import subprocess
from pathlib import Path

import modal


app = modal.App("common-kind-test")
image = modal.Image.from_dockerfile(
    "Dockerfile.modal",
    context_dir=".",
    add_python="3.12",
)
state = modal.Volume.from_name("common-kind-test-state", create_if_missing=True)
secrets = modal.Secret.from_name("common-kind-test-secrets")


@app.function(
    image=image,
    secrets=[secrets],
    volumes={"/app/.wrangler": state},
    min_containers=1,
    max_containers=1,
    region=["us-east", "us-west"],
    scaledown_window=300,
    timeout=86_400,
)
@modal.web_server(3000, startup_timeout=120)
def website():
    environment = os.environ.copy()
    binding_keys = [
        "BOOTSTRAP_ADMIN_EMAIL",
        "BOOTSTRAP_ADMIN_PASSWORD",
        "ADMIN_WRITE_TOKEN",
        "CRM_ALERTS_ENABLED",
        "N8N_INQUIRY_ALERT_WEBHOOK",
        "N8N_INQUIRY_WEBHOOK_SECRET",
        "N8N_PUBLISH_WEBHOOK",
        "N8N_BASE_URL",
        "N8N_API_KEY",
    ]
    binding_lines = [
        f'{key}="{environment.get(key, "").replace("\\", "\\\\").replace(chr(34), "\\\"")}"'
        for key in binding_keys
    ]
    binding_file = Path("/app/.dev.vars")
    binding_file.write_text("\n".join(binding_lines) + "\n", encoding="utf-8")
    binding_file.chmod(0o600)
    environment.update(
        {
            "WRANGLER_WRITE_LOGS": "false",
            "WRANGLER_LOG_PATH": "/app/.wrangler/wrangler.log",
            "MINIFLARE_REGISTRY_PATH": "/app/.wrangler/registry",
            "MODAL_TEST_HOST": "kyawzin-ccna--common-kind-test-website.modal.run",
        }
    )
    subprocess.Popen(
        [
            "npm",
            "run",
            "dev",
            "--",
            "--hostname",
            "0.0.0.0",
            "--port",
            "3000",
        ],
        cwd="/app",
        env=environment,
    )
