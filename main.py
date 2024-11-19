from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request
import json

app = FastAPI()

templates = Jinja2Templates(directory="templates")

app.mount("/static", StaticFiles(directory="static"), name="static")

# Create a list to keep track of connected WebSocket clients and front end clients
active_connections = []
front_end_connections = []


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)

    try:
        while True:
            message = await websocket.receive_text()
            print(f"Received key event: {message}")

            json_msg = json.loads(message)

            if json_msg.get("event") == "connect":
                front_end_connections.append(websocket)
                print("Front end connected")
                continue

            # Broadcast the received key press event to all connected front end clients
            for connection in front_end_connections:
                await connection.send_text(message)
                print(f"Sent to client: {message}") 

    except WebSocketDisconnect:
        active_connections.remove(websocket)
        print("WebSocket connection closed.")


@app.get("/", response_class=HTMLResponse)
async def get_html(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8080)
