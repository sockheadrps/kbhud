use futures::{SinkExt, StreamExt};
use inputbot::{handle_input_events, KeybdKey};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use url::Url;

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "event")]
enum Signal {
    KeyPress { key: String, shift: bool },
    ShiftPressed,
    ShiftReleased,
}

#[tokio::main]
async fn main() {
    let addr = "ws://localhost:8080/ws";
    let url = Url::parse(addr).unwrap();

    // Connect to WebSocket
    let (mut ws_stream, _) = connect_async(url)
        .await
        .expect("Failed to connect to WebSocket");
    println!("Connected to {}", addr);

    // Channel for sending key events
    let (tx, mut rx) = mpsc::channel::<Signal>(10);

    // Arc and Mutex to track Shift key state
    let shift_active = Arc::new(Mutex::new(false));

    // Handle input events
    tokio::spawn({
        let tx = tx.clone();
        let active = Arc::new(Mutex::new(false)); // Shared state with Arc

        async move {
            KeybdKey::bind_all(move |event| {
                let active = Arc::clone(&active); // Clone the Arc to share ownership within the closure
                let mut shift_pressed =
                    KeybdKey::LShiftKey.is_pressed() || KeybdKey::RShiftKey.is_pressed();

                if event == KeybdKey::LShiftKey || event == KeybdKey::RShiftKey {
                    shift_pressed = true;
                }

                // Lock the Mutex to modify the active state
                let mut active_lock = active.lock().unwrap();

                // Check for shift key state changes
                if shift_pressed {
                    if !*active_lock {
                        *active_lock = !*active_lock; // Toggle the active state
                                                      // Send ShiftPressed event immediately when Shift is pressed
                        let signal = Signal::ShiftPressed;
                        if let Err(e) = tx.try_send(signal) {
                            eprintln!("Failed to send ShiftPressed signal: {}", e);
                        }
                    } else {
                        println!("Shift is already active");
                    }
                } else {
                    if *active_lock {
                        *active_lock = !*active_lock; // Toggle the active state
                                                      // Send ShiftReleased event when Shift is released
                        let signal = Signal::ShiftReleased;
                        if let Err(e) = tx.try_send(signal) {
                            eprintln!("Failed to send ShiftReleased signal: {}", e);
                        }
                    }
                }

                // Send the key press event with shift status (whether Shift is pressed or not)
                let signal = Signal::KeyPress {
                    key: format!("{:?}", event),
                    shift: shift_pressed,
                };
                if let Err(e) = tx.try_send(signal) {
                    eprintln!("Failed to send key event: {}", e);
                }
            });
            handle_input_events(true);
        }
    });

    // Main loop to handle WebSocket and input events
    loop {
        tokio::select! {
            Some(key_event) = rx.recv() => {
                let message = serde_json::to_string(&key_event).unwrap();
                if let Err(e) = ws_stream.send(Message::Text(message)).await {
                    eprintln!("Failed to send WebSocket message: {}", e);
                    break;
                }
            },
            Some(ws_message) = ws_stream.next() => {
                match ws_message {
                    Ok(Message::Text(text)) => println!("Received: {}", text),
                    Ok(Message::Close(_)) => {
                        println!("Connection closed by server");
                        break;
                    }
                    Err(e) => {
                        eprintln!("WebSocket error: {}", e);
                        break;
                    }
                    _ => {}
                }
            }
        }
    }

    // Gracefully close the WebSocket
    if let Err(e) = ws_stream.send(Message::Close(None)).await {
        eprintln!("Error closing WebSocket: {}", e);
    }
}
