name: weekly-affiliate-report
steps:
  - id: gather
    command: openclaw.invoke --tool llm-task --action json --args-json '{"prompt":"Generate a weekly Shopee affiliate performance summary for the Malaysian market.","thinking":"low","schema":{"type":"object","properties":{"totalClicks":{"type":"number"},"conversions":{"type":"number"},"topProducts":{"type":"array","items":{"type":"string"}},"revenue":{"type":"number"},"insights":{"type":"array","items":{"type":"string"}}},"required":["totalClicks","conversions","topProducts","revenue","insights"],"additionalProperties":false}}'
  - id: format
    command: openclaw.invoke --tool llm-task --action json --args-json '{"prompt":"Turn the weekly summary into a concise report payload with sections and recommendations.","thinking":"low","schema":{"type":"object","properties":{"title":{"type":"string"},"sections":{"type":"array","items":{"type":"string"}},"recommendations":{"type":"array","items":{"type":"string"}}},"required":["title","sections","recommendations"],"additionalProperties":false}}'
    stdin: $gather.stdout
  - id: approve
    command: echo "Review weekly affiliate report"
    stdin: $format.stdout
    approval: required
  - id: deliver
    command: openclaw.invoke --tool message --action send --args-json '{"text":"Weekly affiliate report ready","channel":"telegram"}'
    condition: $approve.approved
