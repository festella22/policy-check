import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# --- Provider detection ---
PROVIDER = os.getenv("LLM_PROVIDER", "").lower()
if not PROVIDER:
    if os.getenv("ANTHROPIC_API_KEY"):
        PROVIDER = "anthropic"
    elif os.getenv("OPENAI_API_KEY"):
        PROVIDER = "openai"
    elif os.getenv("GOOGLE_API_KEY"):
        PROVIDER = "gemini"
    else:
        raise RuntimeError("No API key found. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY in .env")

# --- System prompt ---
# Replace the DATA sections below with your actual exported policy content.
# Pull exports from Confluence, SharePoint, and JustWorks and paste them in.
SYSTEM_PROMPT = """
You are a Policy & Compliance Assistant embedded in the PI Partners internal dashboard.
You have access to the firm's internal policy documents, regulatory guidance, and HR policies
sourced from Confluence, SharePoint, and JustWorks.

[CONFLUENCE — Policy & Regulatory Guidance]
- Travel & Expense Policy: Employees must submit expenses within 30 days. Receipts required over $25.
- Conflicts of Interest: All outside business activities must be disclosed to Compliance within 5 business days.
- Information Barrier Policy: Personnel on restricted lists may not share material non-public information.
- Code of Ethics: Annual certification required. Violations must be self-reported within 48 hours.
- Record Retention: Client records retained 7 years. Trade records retained 5 years per SEC Rule 17a-4.

[SHAREPOINT — HR & Operational Policies]
- PTO Policy: Employees accrue 15 days/year (years 1-3), 20 days/year (years 4+). Unused PTO does not roll over.
- Remote Work: Up to 2 days/week remote permitted with manager approval. Compliance personnel require CCO sign-off.
- Onboarding Checklist: New hires must complete background check, Form U4 filing, and ethics training within 30 days.
- Termination: IT access revoked same day. Final paycheck issued within 3 business days per state law.
- Benefits Enrollment: Open enrollment runs November 1-15. Changes outside open enrollment require qualifying life event.

[JUSTWORKS — HR & Payroll]
- Payroll: Bi-weekly pay cycle. Direct deposit required. Changes must be submitted by Wednesday for the following cycle.
- Health Insurance: Firm covers 80% of employee premium, 50% of dependent premium.
- 401(k): 3% employer match, vested immediately. Contributions can be changed at any time.
- FMLA: Employees eligible after 12 months of service. Up to 12 weeks unpaid leave.
- State Compliance: Firm registered in NY, CT, FL. Employees in other states require HR approval before hire.

[RESPONSE FORMAT]
You must respond with valid JSON only. No markdown outside the JSON. No made-up policies.
If a policy is not in the data above, say so clearly — do not invent rules.

Respond as:
{"text": "your answer here", "chart": null}

Or with a chart if comparing data:
{"text": "your answer here", "chart": {"type": "bar-h", "title": "...", "bars": [{"label": "...", "value": 0, "color": "#0078D4"}]}}

Chart types: bar-h, bar-v, donut
Keep answers concise, cite the source (Confluence / SharePoint / JustWorks), and flag if something needs legal/compliance review.
"""

# --- Provider call functions ---
def call_anthropic(message: str) -> dict:
    import anthropic
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": message}],
    )
    import json
    return json.loads(response.content[0].text)

def call_openai(message: str) -> dict:
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": message}],
    )
    import json
    return json.loads(response.choices[0].message.content)

def call_gemini(message: str) -> dict:
    from google import genai
    client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"{SYSTEM_PROMPT}\n\nUser question: {message}",
    )
    import json
    return json.loads(response.text)

CALLERS = {"anthropic": call_anthropic, "openai": call_openai, "gemini": call_gemini}

# --- FastAPI app ---
app = FastAPI()

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(req: ChatRequest):
    try:
        result = CALLERS[PROVIDER](req.message)
        return {"text": result.get("text", ""), "chart": result.get("chart", None)}
    except Exception as e:
        return {"text": f"Error: {str(e)}", "chart": None}

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def root():
    return FileResponse("static/dashboard.html")
