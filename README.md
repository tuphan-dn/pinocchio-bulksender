# Get started

## Initialize Program

```bash
# Init project
cargo new --lib pinocchio-bulksender
cargo add pinocchio
```

Update the `Cargo.toml` for the BPF:

```toml
[package]
name = "pinocchio-bulksender"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]

[dependencies]
pinocchio = "0.9.2"
```

## Build Program

```bash
# Build project
cargo build-sbf
```
