use crate::error::AppError;
use borsh::{from_slice, BorshDeserialize, BorshSerialize};
use pinocchio::{account_info::AccountInfo, pubkey::Pubkey, ProgramResult};
use pinocchio_associated_token_account::instructions::Create;
use pinocchio_log::log;
use pinocchio_token;
use pinocchio_token_2022;

#[derive(Clone, Debug, Default, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct SafeTransferParameters {
    pub amount: u64,
}

pub fn invoke(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    log!("Safe Transfer");

    // Parse account infos
    let accounts_iter = &mut accounts.iter();
    let authority = accounts_iter.next().ok_or(AppError::InvalidAccount)?;
    let from = accounts_iter.next().ok_or(AppError::InvalidAccount)?;
    let owner = accounts_iter.next().ok_or(AppError::InvalidAccount)?;
    let to = accounts_iter.next().ok_or(AppError::InvalidAccount)?;
    let mint = accounts_iter.next().ok_or(AppError::InvalidAccount)?;
    let system_program = accounts_iter.next().ok_or(AppError::InvalidAccount)?;
    let token_program = accounts_iter.next().ok_or(AppError::InvalidAccount)?;

    // Parse params
    let params: SafeTransferParameters =
        from_slice(instruction_data).map_err(|_| AppError::InvalidSafeTransferParameters)?;

    if to.owner().eq(&Pubkey::default()) {
        Create {
            funding_account: authority,
            account: to,
            wallet: owner,
            mint,
            system_program,
            token_program,
        }
        .invoke()?;
    }

    // Legacy token
    if pinocchio_token::check_id(token_program.key()) {
        pinocchio_token::instructions::Transfer {
            from,
            to,
            authority,
            amount: params.amount,
        }
        .invoke()?;
        return Ok(());
    }

    // Token 2022
    if pinocchio_token_2022::check_id(token_program.key()) {
        pinocchio_token_2022::instructions::Transfer {
            from,
            to,
            authority,
            amount: params.amount,
            token_program: token_program.key(),
        }
        .invoke()?;
        return Ok(());
    }

    return Err(AppError::InvalidTokenProgram.into());
}
