// 贪食蛇 Tauri 入口 — 原生菜单栏 + 事件桥接前端

use std::sync::Arc;
use tauri::menu::{
    CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu,
};
use tauri::{Emitter, Listener};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let h: tauri::AppHandle = app.handle().clone();

            // ── 游戏 菜单 ──
            let new_game = MenuItem::with_id(&h, "new_game", "新游戏", true, Some("CmdOrCtrl+N"))?;
            let pause = MenuItem::with_id(&h, "pause", "暂停 / 继续", true, Some("Space"))?;
            let reset_item = MenuItem::with_id(&h, "reset", "重置", true, Some("CmdOrCtrl+R"))?;
            let game_sub = Submenu::with_items(&h, "游戏", true, &[&new_game, &pause, &reset_item])?;

            // ── 棋盘 菜单 (CheckMenuItem 用于勾选) ──
            let board20 = CheckMenuItem::with_id(&h, "board_20", "20 × 20", true, true, None::<&str>)?;
            let board30 = CheckMenuItem::with_id(&h, "board_30", "30 × 30", true, false, None::<&str>)?;
            let board50 = CheckMenuItem::with_id(&h, "board_50", "50 × 50", true, false, None::<&str>)?;
            let board_custom = MenuItem::with_id(&h, "board_custom", "自定义大小…", true, None::<&str>)?;
            let sep = PredefinedMenuItem::separator(&h)?;
            let board_sub = Submenu::with_items(
                &h,
                "棋盘",
                true,
                &[
                    &board20 as &_,
                    &board30 as &_,
                    &board50 as &_,
                    &sep as &_,
                    &board_custom as &_,
                ],
            )?;

            // ── 外观 菜单 ──
            let mint = CheckMenuItem::with_id(&h, "theme_mint", "薄荷绿", true, true, None::<&str>)?;
            let ocean = CheckMenuItem::with_id(&h, "theme_ocean", "深海蓝", true, false, None::<&str>)?;
            let sunset = CheckMenuItem::with_id(&h, "theme_sunset", "日落橘", true, false, None::<&str>)?;
            let appearance_sub = Submenu::with_items(
                &h,
                "外观",
                true,
                &[&mint as &_, &ocean as &_, &sunset as &_],
            )?;

            // ── 帮助 菜单 ──
            let help_controls = MenuItem::with_id(&h, "help_controls", "操作说明", true, None::<&str>)?;
            let about = MenuItem::with_id(&h, "about", "关于", true, None::<&str>)?;
            let help_sub = Submenu::with_items(&h, "帮助", true, &[&help_controls, &about])?;

            // ── 组装菜单栏 ──
            let menu = Menu::with_items(&h, &[&game_sub, &board_sub, &appearance_sub, &help_sub])?;
            app.set_menu(menu)?;

            // 保存 CheckMenuItem 的引用，用于后续更新勾选状态
            let board_items = Arc::new((board20, board30, board50));
            let theme_items = Arc::new((mint, ocean, sunset));

            // 监听前端回传的状态变化，更新菜单勾选项
            let bi = board_items.clone();
            h.listen("state:grid-size", move |e| {
                let size = serde_json::from_str::<u32>(e.payload()).unwrap_or(20);
                let _ = bi.0.set_checked(size == 20);
                let _ = bi.1.set_checked(size == 30);
                let _ = bi.2.set_checked(size == 50);
            });

            let ti = theme_items.clone();
            h.listen("state:theme", move |e| {
                let theme = e.payload().trim_matches('"');
                let _ = ti.0.set_checked(theme == "mint");
                let _ = ti.1.set_checked(theme == "ocean");
                let _ = ti.2.set_checked(theme == "sunset");
            });

            Ok(())
        })
        // 菜单点击 → 发事件给前端
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "new_game" => { let _ = app.emit("menu:new-game", ()); }
                "pause" => { let _ = app.emit("menu:pause", ()); }
                "reset" => { let _ = app.emit("menu:reset", ()); }
                "board_20" => { let _ = app.emit("menu:grid-size", 20u32); }
                "board_30" => { let _ = app.emit("menu:grid-size", 30u32); }
                "board_50" => { let _ = app.emit("menu:grid-size", 50u32); }
                "board_custom" => { let _ = app.emit("menu:custom-size", ()); }
                "theme_mint" => { let _ = app.emit("menu:theme", "mint"); }
                "theme_ocean" => { let _ = app.emit("menu:theme", "ocean"); }
                "theme_sunset" => { let _ = app.emit("menu:theme", "sunset"); }
                "help_controls" => { let _ = app.emit("menu:show-help", ()); }
                "about" => { let _ = app.emit("menu:show-about", ()); }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
