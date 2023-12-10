// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use nix::fcntl::{fcntl, FcntlArg, FdFlag};
use nix::pty::{openpty, OpenptyResult};

use serde::Serialize;

use std::os::fd::AsRawFd as _;
use std::os::fd::FromRawFd as _;
use std::os::fd::RawFd;
use std::os::unix::process::CommandExt as _;
use std::process::{Command, Stdio};

use tauri::State;
use tauri::Window;

#[tauri::command]
fn execute(command: &str, master_fd: State<RawFd>) {
    if let Err(e) = nix::unistd::write(*master_fd, command.as_bytes()) {
        println!("Error when writing to the master: {e:?}");
    }
}

#[derive(Clone, Serialize)]
struct ReadResult {
    read: Vec<u8>,
}

fn spawn_reader(window: Window, master: RawFd) {
    use nix::errno::Errno;

    std::thread::spawn(move || {
        let mut buf = [0; 1024];
        loop {
            std::thread::sleep(std::time::Duration::from_millis(300));
            match nix::unistd::read(master, &mut buf) {
                Ok(num_bytes) => {
                    let result = ReadResult {
                        read: buf[..num_bytes].to_vec(),
                    };

                    if let Err(e) = window.emit("read", result) {
                        println!("Could not emit the read event: {e:?}");
                    }
                }
                Err(Errno::EIO) => {
                    if let Err(e) = window.close() {
                        println!("Could not close a window: {e:?}");
                    }
                    break;
                }
                Err(e) => {
                    println!("Could not read the master: {e:?}");
                    break;
                }
            }
        }
    });
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    use tauri::Manager as _;

    let OpenptyResult { master, slave } = openpty(None, None)?;
    fcntl(master.as_raw_fd(), FcntlArg::F_SETFD(FdFlag::FD_CLOEXEC))?;
    fcntl(slave.as_raw_fd(), FcntlArg::F_SETFD(FdFlag::FD_CLOEXEC))?;

    let mut cmd = Command::new("/bin/bash");
    unsafe {
        cmd.stdin(Stdio::from_raw_fd(slave.as_raw_fd()))
            .stdout(Stdio::from_raw_fd(slave.as_raw_fd()))
            .stderr(Stdio::from_raw_fd(slave.as_raw_fd()))
            .pre_exec(|| {
                let res = libc::setsid();
                if res == -1 {
                    println!("Could not create a new session.");
                }

                let res = libc::ioctl(0, libc::TIOCSCTTY, 0);
                if res == -1 {
                    println!("Could not be the controlling terminal.");
                }

                Ok(())
            });
    }

    let mut child = cmd.spawn()?;
    drop(slave);

    let master_fd = master.as_raw_fd();

    tauri::Builder::default()
        .manage(master_fd)
        .setup(move |app| {
            if let Some(app_win) = app.get_window("main") {
                let app_win_cloned = app_win.clone();

                let _id = app_win.once("start", move |_| {
                    spawn_reader(app_win_cloned, master_fd);
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![execute])
        .run(tauri::generate_context!())?;

    child.wait()?;

    Ok(())
}
