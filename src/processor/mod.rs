use crate::error::AppError;
use pinocchio::{account_info::AccountInfo, pubkey::Pubkey, ProgramResult};

pub mod safe_transfer;

pub struct Processor {}

impl Processor {
    pub fn process(program_id: &Pubkey, accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
        let (&discriminator, instruction_data) =
            data.split_first().ok_or(AppError::InvalidInstruction)?;

        match discriminator {
            0 => safe_transfer::invoke(program_id, accounts, instruction_data),
            _ => Err(AppError::InvalidInstruction.into()),
        }
    }
}
