#!/bin/bash
# Keep-alive watchdog for dev services
while true; do
  sleep 5
  # Check if next-server is running
  if ! ss -tlnp | grep -q ":3000 "; then
    echo "$(date): Next.js died, restarting..." >> /tmp/keep-alive.log
    cd /home/z/my-project && setsid node node_modules/.bin/next dev -p 3000 > /home/z/my-project/dev.log 2>&1 &
  fi
  # Check if DB service is running
  if ! ss -tlnp | grep -q ":3005 "; then
    echo "$(date): DB Service died, restarting..." >> /tmp/keep-alive.log
    cd /home/z/my-project/mini-services/db-service && setsid bun run dev > /tmp/db-service.log 2>&1 &
  fi
done
