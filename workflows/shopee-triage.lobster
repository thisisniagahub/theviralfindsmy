name: shopee-lead-triage
args:
  limit:
    default: "20"
steps:
  - id: collect
    command: openclaw.invoke --tool web_search --args-json '{"query":"Shopee Malaysia trending affiliate products this week","num":20}'
  - id: analyze
    command: openclaw.invoke --tool llm-task --action json --args-json '{"prompt":"Review the collected leads and classify each item by priority with a short action.","thinking":"low","schema":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"priority":{"type":"string","enum":["high","medium","low"]},"action":{"type":"string"}},"required":["name","priority","action"],"additionalProperties":false}}}'
    stdin: $collect.stdout
  - id: approve
    command: echo "Review shopee triage output"
    stdin: $analyze.stdout
    approval: required
  - id: deliver
    command: openclaw.invoke --tool message --action send --args-json '{"text":"Shopee lead triage complete","channel":"telegram"}'
    condition: $approve.approved

