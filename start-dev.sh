#!/bin/bash
cd /home/z/my-project
RETRY=0
MAX_RETRIES=10
while [ $RETRY -lt $MAX_RETRIES ]; do
  bun run dev
  RETRY=$((RETRY + 1))
  echo "Server crashed, restarting in $((RETRY * 2))s... (attempt $RETRY/$MAX_RETRIES)"
  sleep $((RETRY * 2))
done
echo "Max retries reached. Check logs for errors."
