#!/bin/bash
# Start all services for TheViralFinds

echo "Starting DB Service on port 3005..."
cd /home/z/my-project/mini-services/db-service
bun run dev &
DB_PID=$!

echo "Starting Notification Service on port 3004..."
cd /home/z/my-project/mini-services/notification-service
bun run dev &
NOTIF_PID=$!

echo "Starting Next.js Dev Server on port 3000..."
cd /home/z/my-project
bun run dev &
NEXT_PID=$!

echo "All services started!"
echo "  DB Service: PID $DB_PID (port 3005)"
echo "  Notifications: PID $NOTIF_PID (port 3004)"
echo "  Next.js: PID $NEXT_PID (port 3000)"

# Wait for any process to exit
wait
