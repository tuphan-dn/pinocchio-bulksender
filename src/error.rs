use pinocchio::program_error::ProgramError;
use pinocchio_log::log;
use thiserror::Error;

#[derive(Clone, Debug, Eq, Error, PartialEq)]
pub enum AppError {
    #[error("Invalid instruction")]
    InvalidInstruction,

    #[error("Invalid account")]
    InvalidAccount,

    #[error("Math operation overflow")]
    MathOverflow,

    #[error("Invalid offset")]
    InvalidOffset,

    #[error("Invalid safe_transfer parameters")]
    InvalidSafeTransferParameters,

    #[error("Type cast error")]
    TypeCastFailed,

    #[error("Invalid token program")]
    InvalidTokenProgram,
}

impl From<AppError> for ProgramError {
    fn from(e: AppError) -> Self {
        let msg: &str = &e.to_string();
        log!("Error: {}", msg);
        ProgramError::Custom(e as u32)
    }
}
