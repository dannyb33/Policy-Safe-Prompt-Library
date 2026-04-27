set -e

echo "Starting Ollama server..."

# Start Ollama server in background
ollama serve &
SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for Ollama to start..."
sleep 5

# Pull model
echo "Pulling llama3.2..."
ollama pull llama3.2

echo "Model pulled successfully."

# Keep server in foreground
wait $SERVER_PID