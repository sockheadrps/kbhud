use futures_util::{SinkExt, StreamExt};
use inputbot::{handle_input_events, KeybdKey};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc;
use tokio::time::{self, Duration};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "event")]
enum Signal {
    KeyPress { key: String, shift: bool },
    ShiftReleased,
}

#[tokio::main]
async fn main() {
    let addr = "ws://localhost:8000/ws";

    // Create a channel for sending messages to the WebSocket task
    let (tx, mut rx) = mpsc::channel::<Signal>(500);

    let ws_stream = match connect_async(addr).await {
        Ok((ws_stream, _)) => {
            println!("Successfully connected to {}", addr);
            ws_stream
        }
        Err(e) => {
            println!("Failed to connect to server: {}", e);
            return;
        }
    };

    let (mut write, _) = ws_stream.split();

    // Spawn a separate asynchronous task to handle the WebSocket communication
    tokio::spawn(async move {
        while let Some(signal) = rx.recv().await {
            let signal_str = serde_json::to_string(&signal).unwrap();
            if let Err(e) = write.send(Message::Text(signal_str)).await {
                println!("Failed to send message: {}", e);
            }
        }
    });

    let is_shift_active = Arc::new(Mutex::new(false));
    let shift_state = Arc::clone(&is_shift_active);

    KeybdKey::bind_all(move |event| {
        let mut shift_active = shift_state.lock().unwrap();

        println!("Key pressed: {:?}", event);

        match event {
            // Handle `Shift` key presses
            inputbot::KeybdKey::LShiftKey | inputbot::KeybdKey::RShiftKey => {
                if !*shift_active {
                    // On the first press of `Shift`, send a signal
                    *shift_active = true;
                    let signal = Signal::KeyPress {
                        key: "ShiftPressed".to_string(),
                        shift: true,
                    };

                    if let Err(e) = tx.try_send(signal) {
                        println!("Failed to send signal: {}", e);
                    }
                }
            }
            _ => {
                if !KeybdKey::LShiftKey.is_pressed() && !KeybdKey::RShiftKey.is_pressed() {
                    // If no `Shift` keys are pressed, reset the state
                    if *shift_active {
                        *shift_active = false;

                        // Send the `ShiftReleased` event
                        let signal = Signal::ShiftReleased;
                        if let Err(e) = tx.try_send(signal) {
                            println!("Failed to send ShiftReleased signal: {}", e);
                        }
                    }
                }

                // Send the regular key event regardless of `Shift` state
                let signal = Signal::KeyPress {
                    key: format!("{:?}", event),
                    shift: KeybdKey::LShiftKey.is_pressed() || KeybdKey::RShiftKey.is_pressed(),
                };
                if let Err(e) = tx.try_send(signal) {
                    println!("Failed to send key signal: {}", e);
                }
            }
        }
    });

    tokio::task::spawn_blocking(|| {
        handle_input_events(true);
    });

    loop {
        time::sleep(Duration::from_millis(200)).await;
    }
}
