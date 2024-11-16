from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request

# FastAPI application instance
app = FastAPI()

# Create Jinja2 template engine instance
templates = Jinja2Templates(directory="templates")

# Serve static files from the 'static' directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Create a list to keep track of connected WebSocket clients
active_connections = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    print("New WebSocket connection established.")

    try:
        while True:
            # Wait for any messages from the client (keyboard events)
            key_message = await websocket.receive_text()
            print(f"Received key event: {key_message}")

            # Broadcast the received key press event to all connected clients
            for connection in active_connections:
                await connection.send_text(key_message)
                print(f"Sent to client: {key_message}")  # Confirm message sent

    except WebSocketDisconnect:
        active_connections.remove(websocket)
        print("WebSocket connection closed.")

# Serve the main HTML page using TemplateResponse
@app.get("/", response_class=HTMLResponse)
async def get_html(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Run the FastAPI server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)
