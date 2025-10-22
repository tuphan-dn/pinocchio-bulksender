import { describe, expect, it } from 'vitest'
import {
  createAndFundWallet,
  initializeMint,
  loadFixture,
  mintTo,
  sendTransaction,
} from './fixture'
import {
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { TransactionMetadata } from 'litesvm'
import { serialize } from 'borsh'

const SafeTransferParameters = {
  struct: {
    amount: 'u64',
  },
}

describe('safe transfer', async () => {
  const { svm, programId } = loadFixture()
  const payer = createAndFundWallet(svm)

  const supply = 100_000_000_000n

  it('should call the safe_transfer successfully in legacy token', () => {
    const mint = initializeMint(svm, payer)
    const from = mintTo(svm, payer, mint, payer.publicKey, supply)

    const receiver = Keypair.generate()
    const to = getAssociatedTokenAddressSync(mint, receiver.publicKey)

    const params = {
      amount: 1_000_000_000n,
    }

    const instructionDisc = Buffer.from([0])
    const instructionData = serialize(SafeTransferParameters, params)

    const ix = new TransactionInstruction({
      keys: [
        {
          pubkey: payer.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: from,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: receiver.publicKey,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: to,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: mint,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId,
      data: Buffer.concat([instructionDisc, instructionData]),
    })

    const tx = new Transaction().add(ix)

    const re = sendTransaction(svm, tx, [payer])

    if (re instanceof TransactionMetadata) console.log(re.logs())
    else console.log(re.meta().logs())
    expect(re).instanceOf(TransactionMetadata)
  })

  it('should call the safe_transfer successfully in token 2022', () => {
    const mint = initializeMint(
      svm,
      payer,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    )
    const from = mintTo(
      svm,
      payer,
      mint,
      payer.publicKey,
      supply,
      TOKEN_2022_PROGRAM_ID,
    )

    const receiver = Keypair.generate()
    const to = getAssociatedTokenAddressSync(
      mint,
      receiver.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    )

    const params = {
      amount: 1_000_000_000n,
    }

    const instructionDisc = Buffer.from([0])
    const instructionData = serialize(SafeTransferParameters, params)

    const ix = new TransactionInstruction({
      keys: [
        {
          pubkey: payer.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: from,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: receiver.publicKey,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: to,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: mint,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: TOKEN_2022_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId,
      data: Buffer.concat([instructionDisc, instructionData]),
    })

    const tx = new Transaction().add(ix)

    const re = sendTransaction(svm, tx, [payer])

    if (re instanceof TransactionMetadata) console.log(re.logs())
    else console.log(re.meta().logs())
    expect(re).instanceOf(TransactionMetadata)
  })
})
