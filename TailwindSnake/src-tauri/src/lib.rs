// 贪食蛇 Tauri 入口
// 这里只负责启动应用,核心游戏逻辑都在前端。

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
