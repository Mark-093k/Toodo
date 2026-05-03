#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::Local;
use serde_json::{json, Value};
use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::{AppHandle, Manager};

const DATA_DIR_NAME: &str = "ToodoData";

fn data_root(app: &AppHandle) -> Result<PathBuf, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Failed to resolve app data directory: {error}"))?;
    Ok(base.join(DATA_DIR_NAME))
}

fn years_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(data_root(app)?.join("years"))
}

fn backups_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(data_root(app)?.join("backups"))
}

fn ensure_dirs(app: &AppHandle) -> Result<PathBuf, String> {
    let root = data_root(app)?;
    fs::create_dir_all(years_dir(app)?).map_err(|error| format!("Failed to create years directory: {error}"))?;
    fs::create_dir_all(backups_dir(app)?).map_err(|error| format!("Failed to create backups directory: {error}"))?;
    Ok(root)
}

fn meta_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(data_root(app)?.join("meta.json"))
}

fn year_path(app: &AppHandle, year: u32) -> Result<PathBuf, String> {
    Ok(years_dir(app)?.join(format!("{year}.json")))
}

fn read_json(path: &Path) -> Result<Option<Value>, String> {
    if !path.exists() {
        return Ok(None);
    }

    let raw = fs::read_to_string(path).map_err(|error| format!("Failed to read {}: {error}", path.display()))?;
    serde_json::from_str(&raw).map(Some).map_err(|error| format!("Invalid JSON in {}: {error}", path.display()))
}

fn atomic_write_json(path: &Path, value: &Value) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| format!("Invalid path without parent: {}", path.display()))?;
    fs::create_dir_all(parent).map_err(|error| format!("Failed to create {}: {error}", parent.display()))?;

    let temp_path = path.with_extension("json.tmp");
    let content = serde_json::to_vec_pretty(value).map_err(|error| format!("Failed to serialize JSON: {error}"))?;
    fs::write(&temp_path, content).map_err(|error| format!("Failed to write {}: {error}", temp_path.display()))?;

    if path.exists() {
        let backup_path = path.with_extension("json.bak");
        let _ = fs::copy(path, &backup_path);
        fs::remove_file(path).map_err(|error| format!("Failed to replace {}: {error}", path.display()))?;
    }

    fs::rename(&temp_path, path).map_err(|error| format!("Failed to finalize {}: {error}", path.display()))
}

fn validate_meta(meta: &Value) -> Result<(), String> {
    let active_year = meta
        .get("activeYear")
        .and_then(Value::as_u64)
        .ok_or_else(|| "meta.activeYear must be a number".to_string())?;
    if !(1900..=2999).contains(&active_year) {
        return Err("meta.activeYear is out of supported range".to_string());
    }

    let years = meta
        .get("years")
        .and_then(Value::as_array)
        .ok_or_else(|| "meta.years must be an array".to_string())?;
    if years.iter().any(|year| year.as_u64().is_none()) {
        return Err("meta.years must contain only numbers".to_string());
    }

    Ok(())
}

fn validate_year_data(year: u32, data: &Value) -> Result<(), String> {
    let data_year = data
        .get("year")
        .and_then(Value::as_u64)
        .ok_or_else(|| "yearly data year must be a number".to_string())?;
    if data_year != u64::from(year) {
        return Err("yearly data year does not match target year".to_string());
    }

    for field in ["tasks", "taskDailyMemos", "projectExclusions"] {
        if !data.get(field).is_some_and(Value::is_array) {
            return Err(format!("yearly data {field} must be an array"));
        }
    }

    Ok(())
}

#[tauri::command]
fn ensure_data_dir(app: AppHandle) -> Result<String, String> {
    ensure_dirs(&app).map(|path| path.to_string_lossy().to_string())
}

#[tauri::command]
fn get_data_dir_path(app: AppHandle) -> Result<String, String> {
    ensure_data_dir(app)
}

#[tauri::command]
fn open_data_dir(app: AppHandle) -> Result<(), String> {
    let path = ensure_dirs(&app)?;

    #[cfg(target_os = "windows")]
    let mut command = {
        let mut command = Command::new("explorer");
        command.arg(&path);
        command
    };

    #[cfg(target_os = "macos")]
    let mut command = {
        let mut command = Command::new("open");
        command.arg(&path);
        command
    };

    #[cfg(all(unix, not(target_os = "macos")))]
    let mut command = {
        let mut command = Command::new("xdg-open");
        command.arg(&path);
        command
    };

    command
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("Failed to open data directory: {error}"))
}

#[tauri::command]
fn load_meta(app: AppHandle) -> Result<Option<Value>, String> {
    ensure_dirs(&app)?;
    read_json(&meta_path(&app)?)
}

#[tauri::command]
fn save_meta(app: AppHandle, meta: Value) -> Result<(), String> {
    ensure_dirs(&app)?;
    validate_meta(&meta)?;
    atomic_write_json(&meta_path(&app)?, &meta)
}

#[tauri::command]
fn list_years(app: AppHandle) -> Result<Vec<u32>, String> {
    ensure_dirs(&app)?;
    let mut years = BTreeSet::new();

    if let Some(meta) = read_json(&meta_path(&app)?)? {
        if let Some(meta_years) = meta.get("years").and_then(Value::as_array) {
            for year in meta_years.iter().filter_map(Value::as_u64) {
                if (1900..=2999).contains(&year) {
                    years.insert(year as u32);
                }
            }
        }
    }

    for entry in fs::read_dir(years_dir(&app)?).map_err(|error| format!("Failed to list years: {error}"))? {
        let entry = entry.map_err(|error| format!("Failed to read year entry: {error}"))?;
        if entry.path().extension().and_then(|value| value.to_str()) != Some("json") {
            continue;
        }
        if let Some(stem) = entry.path().file_stem().and_then(|value| value.to_str()) {
            if let Ok(year) = stem.parse::<u32>() {
                years.insert(year);
            }
        }
    }

    Ok(years.into_iter().collect())
}

#[tauri::command]
fn load_year_data(app: AppHandle, year: u32) -> Result<Option<Value>, String> {
    ensure_dirs(&app)?;
    read_json(&year_path(&app, year)?)
}

#[tauri::command]
fn save_year_data(app: AppHandle, year: u32, data: Value) -> Result<(), String> {
    ensure_dirs(&app)?;
    validate_year_data(year, &data)?;
    atomic_write_json(&year_path(&app, year)?, &data)
}

#[tauri::command]
fn create_year_data(app: AppHandle, year: u32, data: Value) -> Result<(), String> {
    save_year_data(app, year, data)
}

#[tauri::command]
fn delete_year_data(app: AppHandle, year: u32) -> Result<(), String> {
    let path = year_path(&app, year)?;
    if path.exists() {
        fs::remove_file(&path).map_err(|error| format!("Failed to delete {}: {error}", path.display()))?;
    }
    Ok(())
}

#[tauri::command]
fn backup_year_data(app: AppHandle, year: u32) -> Result<String, String> {
    ensure_dirs(&app)?;
    let source = year_path(&app, year)?;
    if !source.exists() {
        return Err(format!("{year} data file does not exist yet"));
    }

    let timestamp = Local::now().format("%Y%m%d-%H%M%S").to_string();
    let target = backups_dir(&app)?.join(format!("{year}-{timestamp}.json"));
    fs::copy(&source, &target)
        .map(|_| target.to_string_lossy().to_string())
        .map_err(|error| format!("Failed to create backup: {error}"))
}

#[tauri::command]
fn export_year_data(app: AppHandle, year: u32) -> Result<Option<Value>, String> {
    load_year_data(app, year)
}

#[tauri::command]
fn import_year_data(app: AppHandle, year: u32, data: Value) -> Result<(), String> {
    let _ = backup_year_data(app.clone(), year);
    save_year_data(app, year, data)
}

#[tauri::command]
fn create_empty_year_data(year: u32) -> Value {
    let now = Local::now().to_rfc3339();
    json!({
        "schemaVersion": 4,
        "year": year,
        "tasks": [],
        "taskDailyMemos": [],
        "projectExclusions": [],
        "createdAt": now,
        "updatedAt": now
    })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            ensure_data_dir,
            get_data_dir_path,
            open_data_dir,
            load_meta,
            save_meta,
            list_years,
            load_year_data,
            save_year_data,
            create_year_data,
            delete_year_data,
            backup_year_data,
            export_year_data,
            import_year_data,
            create_empty_year_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running Toodo desktop application");
}
