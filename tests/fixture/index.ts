import {
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  PublicKey,
} from '@solana/web3.js'
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMint2Instruction,
  getAssociatedTokenAddressSync,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token'
import {
  FailedTransactionMetadata,
  LiteSVM,
  TransactionMetadata,
} from 'litesvm'
import { readFileSync } from 'fs'

export function loadFixture(programName = 'pinocchio_bulksender') {
  const privkey = readFileSync(
    `./target/deploy/${programName}-keypair.json`,
    'utf8',
  )
  const keypair = Keypair.fromSecretKey(Buffer.from(JSON.parse(privkey)))
  const svm = new LiteSVM()
  svm.addProgramFromFile(keypair.publicKey, `./target/deploy/${programName}.so`)

  return { svm, programId: keypair.publicKey }
}

export function createAndFundWallet(
  svm: LiteSVM,
  keypair = Keypair.generate(),
) {
  svm.airdrop(keypair.publicKey, BigInt(1000 * LAMPORTS_PER_SOL))
  return keypair
}

export function sendTransaction(
  svm: LiteSVM,
  tx: Transaction,
  signers: Keypair[] = [],
  debug = false,
) {
  tx.recentBlockhash = svm.latestBlockhash()
  tx.sign(...signers)
  const re = svm.sendTransaction(tx)
  svm.expireBlockhash() // To move the slot forward and avoid duplicated tx hash
  if (debug && re instanceof FailedTransactionMetadata)
    console.trace(re.meta().logs())
  return re
}

export function initializeMint(
  svm: LiteSVM,
  authority: Keypair,
  mint = Keypair.generate(),
  decimals = 9,
  tokenProgram = TOKEN_PROGRAM_ID,
) {
  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: authority.publicKey,
      newAccountPubkey: mint.publicKey,
      space: MINT_SIZE,
      lamports: Number(svm.minimumBalanceForRentExemption(BigInt(MINT_SIZE))),
      programId: tokenProgram,
    }),
    createInitializeMint2Instruction(
      mint.publicKey,
      decimals,
      authority.publicKey,
      authority.publicKey,
      tokenProgram,
    ),
  )

  const re = sendTransaction(svm, tx, [authority, mint])
  if (!(re instanceof TransactionMetadata))
    throw new Error('Cannot initialize mint')

  return mint.publicKey
}

export function mintTo(
  svm: LiteSVM,
  authority: Keypair,
  mint: PublicKey,
  to: PublicKey,
  amount: bigint,
  tokenProgram = TOKEN_PROGRAM_ID,
) {
  const tokenAccount = getAssociatedTokenAddressSync(
    mint,
    to,
    true,
    tokenProgram,
  )

  const tx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      authority.publicKey,
      tokenAccount,
      to,
      mint,
      tokenProgram,
    ),
    createMintToInstruction(
      mint,
      tokenAccount,
      authority.publicKey,
      amount,
      [],
      tokenProgram,
    ),
  )

  const re = sendTransaction(svm, tx, [authority])
  if (!(re instanceof TransactionMetadata))
    throw new Error('Cannot initialize mint')

  return tokenAccount
}
