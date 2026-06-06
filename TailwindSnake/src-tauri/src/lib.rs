// 贪食蛇 Tauri 入口
// 这里只负责启动应用,核心游戏逻辑都在前端。

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // 这里可以加自定义命令,例如本地保存最高分(目前用 localStorage)
            let _window = app.get_webview_window("main").unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
