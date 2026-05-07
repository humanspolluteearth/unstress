use tauri::{Manager, Runtime, WebviewWindow};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use serde::Serialize;

#[derive(Serialize)]
struct ProcessResult<T, E> {
    success: bool,
    data: Option<T>,
    error: Option<E>,
}

impl<T, E> ProcessResult<T, E> {
    fn ok(data: T) -> Self {
        Self { success: true, data: Some(data), error: None }
    }
    fn fail(error: E) -> Self {
        Self { success: false, data: None, error: Some(error) }
    }
}

async fn handle_sidecar_startup<R: Runtime>(app_handle: tauri::AppHandle<R>) -> ProcessResult<u16, String> {
    let shell = app_handle.shell();
    let sidecar = match shell.sidecar("binaries/backend") {
        Ok(s) => s,
        Err(e) => return ProcessResult::fail(format!("Sidecar lookup failed: {}", e)),
    };

    let (mut rx_events, _child) = match sidecar.spawn() {
        Ok(res) => res,
        Err(e) => return ProcessResult::fail(format!("Sidecar spawn failed: {}", e)),
    };

    // Buffer to find the port
    while let Some(event) = rx_events.recv().await {
        if let CommandEvent::Stdout(line) = event {
            let line_str = String::from_utf8_lossy(&line);
            if line_str.starts_with("PORT:") {
                let port_str = line_str.trim_start_matches("PORT:").trim();
                if let Ok(port) = port_str.parse::<u16>() {
                    return ProcessResult::ok(port);
                }
            }
            if line_str.starts_with("ERROR:") {
                return ProcessResult::fail(line_str.to_string());
            }
        }
    }

    ProcessResult::fail("Sidecar exited without reporting port".to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            tauri::async_runtime::spawn(async move {
                let result = handle_sidecar_startup(app_handle.clone()).await;
                
                if result.success {
                    if let Some(port) = result.data {
                        // Inject into frontend as a global variable
                        if let Some(main_window) = app_handle.get_webview_window("main") {
                            let js = format!("window.__BACKEND_PORT__ = {};", port);
                            let _ = main_window.eval(&js);
                            println!("Backend successfully started on port {}", port);
                        }
                    }
                } else {
                    if let Some(error) = result.error {
                        eprintln!("Critical Process Error: {}", error);
                        // In a production app, we might trigger a UI error modal here
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
