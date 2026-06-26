# Policy & Compliance Q&A

Instant answers from PI Partners internal policy and regulatory guidance — Confluence, SharePoint, and JustWorks.

## What it is

A browser-based chat dashboard. Ask any question about internal policy, HR rules, or regulatory guidance and get a cited answer in seconds. No special software needed beyond a browser.

## Setup (Windows)

```powershell
python -m pip install -r requirements.txt
copy .env.example .env
# Open .env and replace your-key-here with your Anthropic API key
python -m uvicorn server:app --port 8080
```

Open `http://localhost:8080`.

## Updating policy data

All policy content lives in the `SYSTEM_PROMPT` block inside `server.py`. To update:

1. Export the relevant pages from Confluence / SharePoint / JustWorks
2. Paste the updated content into the appropriate section of `SYSTEM_PROMPT`
3. Restart the server

## Sources

| Source | Content |
|---|---|
| Confluence | Travel & expense, conflicts of interest, information barriers, code of ethics, record retention |
| SharePoint | PTO, remote work, onboarding, termination, benefits enrollment |
| JustWorks | Payroll, health insurance, 401(k), FMLA, state compliance |

## Adding a chart

The LLM can return a chart alongside any answer. Ask questions like "compare PTO accrual by year" or "show me the 401k match breakdown" and it will generate a bar chart automatically.
