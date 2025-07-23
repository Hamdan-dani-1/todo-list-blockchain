use anchor_lang::prelude::*;

declare_id!("9RH4R3tYTBSGtUKnAr6bHd42RuRZvzXb3b65cTGPpqRk");

#[program]
pub mod todo_auth_plain {
    use super::*;

    pub fn register_user(
        ctx: Context<RegisterUser>,
        username: String,
        password: String,
    ) -> Result<()> {
        let user = &mut ctx.accounts.user_account;
        user.username = username;
        user.password = password;
        user.authority = ctx.accounts.authority.key();
        user.todos = vec![];
        msg!("✅ User registered");
        Ok(())
    }

    pub fn add_todo(
        ctx: Context<AddTodo>,
        username: String,
        password: String,
        new_todo: String,
    ) -> Result<()> {
        let user = &mut ctx.accounts.user_account;

        require!(user.username == username, TodoError::InvalidCredentials);
        require!(user.password == password, TodoError::InvalidCredentials);
        require!(user.authority == ctx.accounts.authority.key(), TodoError::Unauthorized);

        user.todos.push(new_todo.clone());
        msg!("✅ Added todo: {}", new_todo);
        Ok(())
    }
}
#[derive(Accounts)]
#[instruction(username: String)]
pub struct RegisterUser<'info> {
    #[account(
        init,
        seeds = [b"user", username.as_bytes()],
        bump,
        payer = authority,
        space = 8 + 32 + (4 + 32) + (4 + 32) + (4 + 1024) // adjust space for username, password, and todos
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct AddTodo<'info> {
    #[account(
        mut,
        seeds = [b"user", username.as_bytes()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
#[account]
pub struct UserAccount {
    pub authority: Pubkey,
    pub username: String,
    pub password: String,
    pub todos: Vec<String>,
}
#[error_code]
pub enum TodoError {
    #[msg("Invalid username or password.")]
    InvalidCredentials,
    #[msg("You are not authorized.")]
    Unauthorized,
}

